package com.finanzas.savings;

import com.finanzas.accounts.Account;
import jakarta.persistence.*;
import java.math.BigDecimal;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "savings_plans")
public class SavingsPlan {
    public enum Type { FIXED, PERCENT }
    public enum Status { ACTIVE, PAUSED }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "month_key", nullable = false, columnDefinition = "char(7)")
    @JdbcTypeCode(SqlTypes.CHAR)
    private String monthKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Type type;

    @Column(name = "amount_planned", nullable = false, precision = 14, scale = 2)
    private BigDecimal amountPlanned;

    @Column(precision = 6, scale = 4)
    private BigDecimal percent;

    @Column(nullable = false)
    private Integer priority = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.ACTIVE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_account_id")
    private Account sourceAccount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_account_id")
    private Account targetAccount;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getMonthKey() { return monthKey; }
    public void setMonthKey(String monthKey) { this.monthKey = monthKey; }
    public Type getType() { return type; }
    public void setType(Type type) { this.type = type; }
    public BigDecimal getAmountPlanned() { return amountPlanned; }
    public void setAmountPlanned(BigDecimal amountPlanned) { this.amountPlanned = amountPlanned; }
    public BigDecimal getPercent() { return percent; }
    public void setPercent(BigDecimal percent) { this.percent = percent; }
    public Integer getPriority() { return priority; }
    public void setPriority(Integer priority) { this.priority = priority; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public Account getSourceAccount() { return sourceAccount; }
    public void setSourceAccount(Account sourceAccount) { this.sourceAccount = sourceAccount; }
    public Account getTargetAccount() { return targetAccount; }
    public void setTargetAccount(Account targetAccount) { this.targetAccount = targetAccount; }
}
