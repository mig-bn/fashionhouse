package com.fashionhouse.application.service;

import com.fashionhouse.interfaces.rest.dto.analytics.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@Transactional(readOnly = true)
public class AnalyticsService {

    @PersistenceContext
    private EntityManager em;

    // ── Dashboard Summary ───────────────────────────────────────────────────

    public DashboardSummaryDto getDashboardSummary() {
        // Total revenue (delivered/shipped orders)
        BigDecimal totalRevenue = querySingleBigDecimal("""
            SELECT COALESCE(SUM(o.total), 0)
            FROM orders o
            WHERE o.status IN ('DELIVERED', 'SHIPPED', 'PROCESSING', 'CONFIRMED')
            """);

        // Total orders
        long totalOrders = querySingleLong("""
            SELECT COUNT(*) FROM orders WHERE status != 'CANCELLED'
            """);

        // Total customers
        long totalCustomers = querySingleLong("SELECT COUNT(*) FROM customers");

        // Pending orders
        long pendingOrders = querySingleLong("""
            SELECT COUNT(*) FROM orders WHERE status = 'PENDING'
            """);

        // This month revenue
        BigDecimal revenueThisMonth = querySingleBigDecimal("""
            SELECT COALESCE(SUM(o.total), 0)
            FROM orders o
            WHERE o.status IN ('DELIVERED', 'SHIPPED', 'PROCESSING', 'CONFIRMED')
              AND DATE_TRUNC('month', o.created_at) = DATE_TRUNC('month', NOW())
            """);

        // Orders this month
        long ordersThisMonth = querySingleLong("""
            SELECT COUNT(*) FROM orders
            WHERE status != 'CANCELLED'
              AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
            """);

        // New customers this month
        long newCustomersThisMonth = querySingleLong("""
            SELECT COUNT(*) FROM customers
            WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
            """);

        // Active quotations
        long activeQuotations = querySingleLong("""
            SELECT COUNT(*) FROM quotations WHERE status = 'PENDING'
            """);

        // Conversion rate (quotations accepted / total quotations)
        double conversionRate = 0.0;
        Object[] convRow = (Object[]) em.createNativeQuery("""
            SELECT COUNT(*) as total,
                   SUM(CASE WHEN status = 'ACCEPTED' THEN 1 ELSE 0 END) as accepted
            FROM quotations
            """).getSingleResult();
        long qTotal = toLong(convRow[0]);
        long qAccepted = toLong(convRow[1]);
        if (qTotal > 0) {
            conversionRate = (double) qAccepted / qTotal * 100.0;
        }

        return new DashboardSummaryDto(
            totalRevenue, totalOrders, totalCustomers, pendingOrders,
            revenueThisMonth, ordersThisMonth, newCustomersThisMonth,
            activeQuotations, round2(conversionRate)
        );
    }

    // ── Sales by Period ─────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    public List<SalesDataDto> getSalesByPeriod(LocalDate from, LocalDate to) {
        List<Object[]> rows = em.createNativeQuery("""
            SELECT TO_CHAR(o.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') as date,
                   COALESCE(SUM(o.total), 0) as revenue,
                   COUNT(*) as order_count
            FROM orders o
            WHERE o.status IN ('DELIVERED', 'SHIPPED', 'PROCESSING', 'CONFIRMED')
              AND o.created_at >= :from
              AND o.created_at < :to
            GROUP BY TO_CHAR(o.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD')
            ORDER BY 1 ASC
            """)
            .setParameter("from", from.atStartOfDay())
            .setParameter("to", to.plusDays(1).atStartOfDay())
            .getResultList();

        return rows.stream().map(r -> new SalesDataDto(
            (String) r[0],
            toBigDecimal(r[1]),
            toLong(r[2])
        )).toList();
    }

    // ── Top Products ────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    public List<TopProductDto> getTopProducts(LocalDate from, LocalDate to) {
        List<Object[]> rows = em.createNativeQuery("""
            SELECT p.name,
                   SUM(oi.quantity) as units_sold,
                   SUM(oi.line_total) as revenue
            FROM order_items oi
            JOIN product_variants pv ON pv.id = oi.variant_id
            JOIN products p ON p.id = pv.product_id
            JOIN orders o ON o.id = oi.order_id
            WHERE o.status IN ('DELIVERED', 'SHIPPED', 'PROCESSING', 'CONFIRMED')
              AND o.created_at >= :from
              AND o.created_at < :to
            GROUP BY p.id, p.name
            ORDER BY revenue DESC
            LIMIT 10
            """)
            .setParameter("from", from.atStartOfDay())
            .setParameter("to", to.plusDays(1).atStartOfDay())
            .getResultList();

        return rows.stream().map(r -> new TopProductDto(
            (String) r[0],
            toLong(r[1]),
            toBigDecimal(r[2])
        )).toList();
    }

    // ── Quotation Conversion Rate ───────────────────────────────────────────

    public ConversionRateDto getQuotationConversionRate() {
        Object[] row = (Object[]) em.createNativeQuery("""
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = 'ACCEPTED' THEN 1 ELSE 0 END) as accepted,
                SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected,
                SUM(CASE WHEN status = 'PENDING'  THEN 1 ELSE 0 END) as pending
            FROM quotations
            """).getSingleResult();

        long total    = toLong(row[0]);
        long accepted = toLong(row[1]);
        long rejected = toLong(row[2]);
        long pending  = toLong(row[3]);
        double rate = total > 0 ? round2((double) accepted / total * 100.0) : 0.0;

        return new ConversionRateDto(total, accepted, rejected, pending, rate);
    }

    // ── Low Stock Alerts ────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    public List<LowStockAlertDto> getLowStockAlerts() {
        List<Object[]> rows = em.createNativeQuery("""
            SELECT pv.sku, p.name, pv.size, pv.color, pv.stock_quantity
            FROM product_variants pv
            JOIN products p ON p.id = pv.product_id
            WHERE pv.stock_quantity < 5
              AND p.is_active = true
            ORDER BY pv.stock_quantity ASC, p.name ASC
            """).getResultList();

        return rows.stream().map(r -> new LowStockAlertDto(
            (String) r[0],
            (String) r[1],
            (String) r[2],
            (String) r[3],
            ((Number) r[4]).intValue()
        )).toList();
    }

    // ── Revenue by Category ─────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    public List<RevenueByCategoryDto> getRevenueByCategory(LocalDate from, LocalDate to) {
        List<Object[]> rows = em.createNativeQuery("""
            SELECT c.name,
                   SUM(oi.line_total) as revenue,
                   COUNT(DISTINCT o.id) as order_count
            FROM order_items oi
            JOIN product_variants pv ON pv.id = oi.variant_id
            JOIN products p ON p.id = pv.product_id
            JOIN categories c ON c.id = p.category_id
            JOIN orders o ON o.id = oi.order_id
            WHERE o.status IN ('DELIVERED', 'SHIPPED', 'PROCESSING', 'CONFIRMED')
              AND o.created_at >= :from
              AND o.created_at < :to
            GROUP BY c.id, c.name
            ORDER BY revenue DESC
            """)
            .setParameter("from", from.atStartOfDay())
            .setParameter("to", to.plusDays(1).atStartOfDay())
            .getResultList();

        return rows.stream().map(r -> new RevenueByCategoryDto(
            (String) r[0],
            toBigDecimal(r[1]),
            toLong(r[2])
        )).toList();
    }

    // ── helpers ─────────────────────────────────────────────────────────────

    private BigDecimal querySingleBigDecimal(String sql) {
        Object result = em.createNativeQuery(sql).getSingleResult();
        return toBigDecimal(result);
    }

    private long querySingleLong(String sql) {
        Object result = em.createNativeQuery(sql).getSingleResult();
        return toLong(result);
    }

    private BigDecimal toBigDecimal(Object o) {
        if (o == null) return BigDecimal.ZERO;
        if (o instanceof BigDecimal bd) return bd;
        return new BigDecimal(o.toString());
    }

    private long toLong(Object o) {
        if (o == null) return 0L;
        return ((Number) o).longValue();
    }

    private double round2(double v) {
        return BigDecimal.valueOf(v).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }
}
