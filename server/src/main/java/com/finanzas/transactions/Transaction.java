package com.finanzas.transactions;

import com.finanzas.accounts.Account;
import com.finanzas.categories.Category;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity
@Table(name = "transactions")
@Getter
@Setter
@NoArgsConstructor
@ToString(exclude = {"account", "category"})
public class Transaction {
    public enum Type { INCOME, EXPENSE }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Type type;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private LocalDate date;

    @Column(length = 255)
    private String description;
}
