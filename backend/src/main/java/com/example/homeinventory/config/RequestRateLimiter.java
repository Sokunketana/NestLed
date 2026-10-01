package com.example.homeinventory.config;

import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.TimeMeter;
import java.time.Duration;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.Map;

/** In-memory limits for a single backend instance. Never evict an active bucket. */
public class RequestRateLimiter {
    public enum Rule { PUBLIC_AUTH, UPLOAD, INVITATION }

    private final RateLimitProperties properties;
    private final TimeMeter clock;
    private final Map<Rule, LinkedHashMap<String, Entry>> buckets = new EnumMap<>(Rule.class);

    public RequestRateLimiter(RateLimitProperties properties) {
        this(properties, TimeMeter.SYSTEM_NANOTIME);
    }

    RequestRateLimiter(RateLimitProperties properties, TimeMeter clock) {
        this.properties = properties;
        this.clock = clock;
        for (Rule rule : Rule.values()) {
            buckets.put(rule, new LinkedHashMap<>(16, 0.75f, true));
        }
    }

    /** Returns zero on success, otherwise the number of seconds before retrying. */
    public synchronized long retryAfter(Rule rule, String identity) {
        Duration period = period(rule);
        long now = clock.currentTimeNanos();
        LinkedHashMap<String, Entry> pool = buckets.get(rule);
        var iterator = pool.entrySet().iterator();
        while (iterator.hasNext()) {
            Entry entry = iterator.next().getValue();
            // After a full refill period of inactivity, a fresh bucket is equivalent.
            if (now - entry.lastAccess < period.toNanos()) {
                break;
            }
            iterator.remove();
        }
        Entry entry = pool.get(identity);
        if (entry == null) {
            if (pool.size() >= properties.maxBuckets()) {
                Entry oldest = pool.values().iterator().next();
                return seconds(period.toNanos() - (now - oldest.lastAccess));
            }
            long capacity = switch (rule) {
                case PUBLIC_AUTH -> properties.publicAuth().capacity();
                case UPLOAD -> properties.uploads().capacity();
                case INVITATION -> properties.invitations().capacity();
            };
            Bucket bucket = Bucket.builder()
                    .withCustomTimePrecision(clock)
                    .addLimit(limit -> limit.capacity(capacity).refillGreedy(capacity, period))
                    .build();
            entry = new Entry(bucket, now);
            pool.put(identity, entry);
        }
        entry.lastAccess = now;
        ConsumptionProbe probe = entry.bucket.tryConsumeAndReturnRemaining(1);
        return probe.isConsumed() ? 0 : seconds(probe.getNanosToWaitForRefill());
    }

    private Duration period(Rule rule) {
        return switch (rule) {
            case PUBLIC_AUTH -> properties.publicAuth().period();
            case UPLOAD -> properties.uploads().period();
            case INVITATION -> properties.invitations().period();
        };
    }

    private static long seconds(long nanos) {
        return Math.max(1, (nanos + 999_999_999L) / 1_000_000_000L);
    }

    private static final class Entry {
        private final Bucket bucket;
        private long lastAccess;

        private Entry(Bucket bucket, long lastAccess) {
            this.bucket = bucket;
            this.lastAccess = lastAccess;
        }
    }
}
