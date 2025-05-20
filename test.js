import { PerformanceObserver } from 'node:perf_hooks';
import { resolve4 } from 'node:dns/promises';
import { setTimeout, setImmediate } from 'node:timers/promises';
import { exec } from 'child_process';

let c = 1;
const obs = new PerformanceObserver((items) => {
	items.getEntries().forEach((item) => {
		console.log(`DNS query ${c++} took ${item.duration}ms`);
	});
});
obs.observe({ entryTypes: ['dns'] });

console.log('Cache Test of github.com');

await resolve4('github.com', { ttl: true });

await setImmediate();
let result = await resolve4('github.com', { ttl: true });

if (result[0].ttl) {
	// Sleep for TTL of dns query 2
	await setTimeout((result[0].ttl + 1) * 1000);
} else {
	await setImmediate();
}

await resolve4('github.com', { ttl: true });
await resolve4('github.com', { ttl: true });
