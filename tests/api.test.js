const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod, app;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri(); 
  process.env.SESSION_KEY = 'test-secret';
  await mongoose.connect(mongod.getUri());
  app = require('../app');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

const disha = { username: 'disha', email: 'disha@test.com', password: 'disha1234' };
const aisha = { username: 'aisha', email: 'aisha@test.com', password: 'aisha1234!' };

const login = async (u) => {
  const agent = request.agent(app); 
  await agent.post('/api/auth/login').send({ email: u.email, password: u.password });
  return agent;
};

describe('auth', () => {
  test('signup succeeds', async () => {
    const res = await request(app).post('/api/auth/signup').send(disha);
    expect(res.status).toBe(201);
  });

  test('duplicate email gives 409', async () => {
    const res = await request(app).post('/api/auth/signup').send(disha);
    expect(res.status).toBe(409);
  });

  test('duplicate username gives 409', async () => {
    const res = await request(app).post('/api/auth/signup')
      .send({ ...disha, email: 'other@test.com' });
    expect(res.status).toBe(409);
  });

  test('invalid username gives 400', async () => {
    const res = await request(app).post('/api/auth/signup')
      .send({ username: 'a b!', email: 'x@test.com', password: 'Pass1234!' });
    expect(res.status).toBe(400);
  });

  test('wrong password and unknown email give the same generic 401', async () => {
    const wrongPw = await request(app).post('/api/auth/login')
      .send({ email: disha.email, password: 'nope' });
    const noUser = await request(app).post('/api/auth/login')
      .send({ email: 'ghost@test.com', password: 'nope' });
    expect(wrongPw.status).toBe(401);
    expect(noUser.status).toBe(401);
    expect(wrongPw.body.error).toBe(noUser.body.error);
  });

  test('login sets session, /me returns user without password or salt', async () => {
    const agent = await login(disha);
    const me = await agent.get('/api/auth/me');
    expect(me.body.user.email).toBe(disha.email);
    expect(JSON.stringify(me.body)).not.toMatch(/password|salt/i);
  });

  test('/me is null for guests', async () => {
    const me = await request(app).get('/api/auth/me');
    expect(me.body.user).toBeNull();
  });

  test('logout ends the session', async () => {
    const agent = await login(disha);
    await agent.post('/api/auth/logout');
    const me = await agent.get('/api/auth/me');
    expect(me.body.user).toBeNull();
  });
});

describe('posts', () => {
  let dishaAgent, aishaAgent, publicId, privateId;

beforeAll(async () => {
  // clean slate for this block (deleteMany keeps the unique indexes)
  for (const c of Object.values(mongoose.connection.collections)) {
    await c.deleteMany({});
  }
  await request(app).post('/api/auth/signup').send(disha);
  await request(app).post('/api/auth/signup').send(aisha);
  dishaAgent = await login(disha);
  aishaAgent = await login(aisha);
});

  test('guest cannot create a post', async () => {
    const res = await request(app).post('/api/posts').send({ title: 't', content: 'c' });
    expect(res.status).toBe(401);
  });

  test('missing title gives 400', async () => {
    const res = await dishaAgent.post('/api/posts').send({ title: '  ', content: 'c' });
    expect(res.status).toBe(400);
  });

  test('title over 150 chars gives 400', async () => {
    const res = await dishaAgent.post('/api/posts')
      .send({ title: 'a'.repeat(151), content: 'c' });
    expect(res.status).toBe(400);
  });

  test('user creates a public and a private post', async () => {
    const pub = await dishaAgent.post('/api/posts')
      .send({ title: 'Public one', content: 'hello world', isPublic: true });
    const priv = await dishaAgent.post('/api/posts')
      .send({ title: 'Secret one', content: 'hidden', isPublic: false });
    expect(pub.status).toBe(201);
    expect(priv.status).toBe(201);
    expect(pub.body.post.isOwner).toBe(true);
    publicId = pub.body.post._id;
    privateId = priv.body.post._id;
  });

  test('guest sees public post but not private post in the feed', async () => {
    const res = await request(app).get('/api/posts');
    const titles = res.body.posts.map((p) => p.title);
    expect(titles).toContain('Public one');
    expect(titles).not.toContain('Secret one');
  });

  test('feed does not include post content', async () => {
    const res = await request(app).get('/api/posts');
    expect(res.body.posts[0].content).toBeUndefined();
  });

  test('guest can read a public post, with no password or salt leaked', async () => {
    const res = await request(app).get(`/api/posts/${publicId}`);
    expect(res.status).toBe(200);
    expect(res.body.post.isOwner).toBe(false);
    expect(JSON.stringify(res.body)).not.toMatch(/password|salt/i);
  });

  test('private post is 404 for guest and other user, 200 for owner', async () => {
    expect((await request(app).get(`/api/posts/${privateId}`)).status).toBe(404);
    expect((await aishaAgent.get(`/api/posts/${privateId}`)).status).toBe(404);
    expect((await dishaAgent.get(`/api/posts/${privateId}`)).status).toBe(200);
  });

  test('invalid id gives 404, not a crash', async () => {
    const res = await request(app).get('/api/posts/not-an-id');
    expect(res.status).toBe(404);
  });

  test('other user gets 403 editing a public post and 404 on a private one', async () => {
    const body = { title: 'hacked', content: 'x' };
    expect((await aishaAgent.put(`/api/posts/${publicId}`).send(body)).status).toBe(403);
    expect((await aishaAgent.put(`/api/posts/${privateId}`).send(body)).status).toBe(404);
  });

  test('owner can update a post', async () => {
    const res = await dishaAgent.put(`/api/posts/${publicId}`)
      .send({ title: 'Public edited', content: 'new text' });
    expect(res.status).toBe(200);
    expect(res.body.post.title).toBe('Public edited');
  });

  test('search finds a post, and a bad regex does not crash', async () => {
    const found = await request(app).get('/api/posts?search=edited');
    expect(found.body.posts.length).toBe(1);
    const bad = await request(app).get('/api/posts?search=(((');
    expect(bad.status).toBe(200);
  });

  test('other user cannot delete, owner can', async () => {
    expect((await aishaAgent.delete(`/api/posts/${publicId}`)).status).toBe(403);
    expect((await dishaAgent.delete(`/api/posts/${publicId}`)).status).toBe(200);
    expect((await request(app).get(`/api/posts/${publicId}`)).status).toBe(404);
  });
});