package com.fashionhouse.interfaces.rest.dto.analytics;

import java.math.BigDecimal;

public record DashboardSummaryDto(
    BigDecimal totalRevenue,
    long totalOrders,
    long totalCustomers,
    long pendingOrders,
    BigDecimal revenueThisMonth,
    long ordersThisMonth,
    long newCustomersThisMonth,
    long activeQuotations,
    double conversionRate
) {}
