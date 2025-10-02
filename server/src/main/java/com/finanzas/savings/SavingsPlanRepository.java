package com.finanzas.savings;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SavingsPlanRepository extends JpaRepository<SavingsPlan, Long> {
    List<SavingsPlan> findByMonthKey(String monthKey);
}

