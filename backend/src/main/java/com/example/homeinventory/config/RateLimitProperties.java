package com.example.homeinventory.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Min;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties("app.rate-limit")
public record RateLimitProperties(
        @DefaultValue("10000") @Min(1) int maxBuckets,
        @DefaultValue @Valid Limit publicAuth,
        @DefaultValue @Valid Limit uploads,
        @DefaultValue @Valid InvitationLimit invitations) {

    public record Limit(
            @DefaultValue("20") @Min(1) long capacity,
            @DefaultValue("1m") Duration period) {
        @AssertTrue(message = "period must be positive and no greater than one day")
        public boolean isPeriodValid() {
            return validPeriod(period);
        }
    }

    public record InvitationLimit(
            @DefaultValue("10") @Min(1) long capacity,
            @DefaultValue("1h") Duration period) {
        @AssertTrue(message = "period must be positive and no greater than one day")
        public boolean isPeriodValid() {
            return validPeriod(period);
        }
    }

    private static boolean validPeriod(Duration period) {
        return period != null && !period.isZero() && !period.isNegative()
                && period.compareTo(Duration.ofDays(1)) <= 0;
    }
}
