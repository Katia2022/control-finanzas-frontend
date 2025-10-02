package com.finanzas.budgets;

import com.finanzas.categories.Category;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;

@Entity
@Table(name = "budget_categories", uniqueConstraints = @UniqueConstraint(name = "uk_budget_cat_month", columnNames = {"category_id", "month_key"}))
public class BudgetCategory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(name = "month_key", nullable = false, columnDefinition = "char(7)")
    @JdbcTypeCode(SqlTypes.CHAR)
    private String monthKey;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }
    public String getMonthKey() { return monthKey; }
    public void setMonthKey(String monthKey) { this.monthKey = monthKey; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
}
