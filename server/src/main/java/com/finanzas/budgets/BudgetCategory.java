package com.finanzas.budgets;

import com.finanzas.categories.Category;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity
@Table(name = "budget_categories", uniqueConstraints = @UniqueConstraint(name = "uk_budget_cat_month", columnNames = {"category_id", "month_key"}))
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(exclude = {"category"})
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
}
