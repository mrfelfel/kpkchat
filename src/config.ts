import { createClient } from 'redis';

export const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redis.on('error', (err) => console.error('Redis error:', err));

export const keys = {
  location: (uid: number) => `location-${uid}`,
  step: (uid: number) => `step-${uid}`,
  limit: (uid: number) => `limit-${uid}`,
  signed: (uid: number) => `signed-${uid}`,
  blocked: (a: number, b: number) => `blocked-${a}-${b}`,
  interests: (uid: number) => `interests-${uid}`,
};

export const redisHelpers = {
  setUserLocation: async (uid: number, location: string) => {
    await redis.set(keys.location(uid), location);
  },
  getUserLocation: async (uid: number) => {
    return await redis.get(keys.location(uid));
  },
  setUserStep: async (uid: number, step: string) => {
    await redis.set(keys.step(uid), step);
  },
  getUserStep: async (uid: number) => {
    return await redis.get(keys.step(uid));
  },
  setUserLimit: async (uid: number) => {
    await redis.set(keys.limit(uid), 'limited', { EX: 60 });
  },
  getUserLimit: async (uid: number) => {
    return await redis.get(keys.limit(uid));
  },
  incrSign: async (uid: number) => {
    return await redis.incr(keys.signed(uid));
  },
  setUserBlock: async (uid: number, pid: number) => {
    await redis.set(keys.blocked(uid, pid), 'blocked');
  },
  getUserBlock: async (uid: number, pid: number) => {
    const r1 = await redis.get(keys.blocked(uid, pid));
    if (r1) return r1;
    return await redis.get(keys.blocked(pid, uid));
  },
  setSelectedInterests: async (uid: number, interests: string[]) => {
    await redis.set(keys.interests(uid), JSON.stringify(interests));
  },
  getSelectedInterests: async (uid: number) => {
    const data = await redis.get(keys.interests(uid));
    return data ? JSON.parse(data) as string[] : [];
  },
  clearSelectedInterests: async (uid: number) => {
    await redis.del(keys.interests(uid));
  },
};
