package com.example.homeinventory.config;

import io.github.bucket4j.TimeMeter;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.IntStream;
import org.junit.jupiter.api.Test;

import static com.example.homeinventory.config.RequestRateLimiter.Rule.*;
import static org.assertj.core.api.Assertions.assertThat;

class RequestRateLimiterTest {
    private final AtomicLong nanos = new AtomicLong();
    private final TimeMeter clock = new TimeMeter() {
        public long currentTimeNanos() { return nanos.get(); }
        public boolean isWallClockBased() { return false; }
    };

    private RequestRateLimiter limiter(int maxBuckets) {
        var limit = new RateLimitProperties.Limit(2, Duration.ofSeconds(10));
        return new RequestRateLimiter(new RateLimitProperties(maxBuckets, limit, limit,
                new RateLimitProperties.InvitationLimit(2, Duration.ofSeconds(10))), clock);
    }

    @Test
    void exhaustsAndGraduallyRefillsWithAccurateRetryAfter() {
        var limiter = limiter(10);
        assertThat(limiter.retryAfter(UPLOAD, "alice")).isZero();
        assertThat(limiter.retryAfter(UPLOAD, "alice")).isZero();
        assertThat(limiter.retryAfter(UPLOAD, "alice")).isEqualTo(5);
        nanos.set(Duration.ofMillis(4500).toNanos());
        assertThat(limiter.retryAfter(UPLOAD, "alice")).isEqualTo(1);
        nanos.set(Duration.ofSeconds(5).toNanos());
        assertThat(limiter.retryAfter(UPLOAD, "alice")).isZero();
    }

    @Test
    void keepsUsersAndOperationsIndependent() {
        var limiter = limiter(10);
        limiter.retryAfter(UPLOAD, "alice");
        limiter.retryAfter(UPLOAD, "alice");
        assertThat(limiter.retryAfter(UPLOAD, "alice")).isPositive();
        assertThat(limiter.retryAfter(UPLOAD, "bob")).isZero();
        assertThat(limiter.retryAfter(INVITATION, "alice")).isZero();
    }

    @Test
    void boundsMemoryWithoutResettingActiveQuotasAndReclaimsIdleBuckets() {
        var limiter = limiter(1);
        limiter.retryAfter(PUBLIC_AUTH, "ip1");
        limiter.retryAfter(PUBLIC_AUTH, "ip1");
        assertThat(limiter.retryAfter(PUBLIC_AUTH, "ip2")).isEqualTo(10);
        assertThat(limiter.retryAfter(PUBLIC_AUTH, "ip1")).isEqualTo(5);
        nanos.set(Duration.ofSeconds(10).toNanos());
        assertThat(limiter.retryAfter(PUBLIC_AUTH, "ip2")).isZero();
    }

    @Test
    void concurrentRequestsCannotOverspendTheBucket() {
        var limiter = limiter(10);
        long accepted = IntStream.range(0, 100).parallel()
                .filter(i -> limiter.retryAfter(UPLOAD, "alice") == 0).count();
        assertThat(accepted).isEqualTo(2);
    }
}
