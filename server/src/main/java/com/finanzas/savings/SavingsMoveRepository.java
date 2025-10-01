package com.finanzas.savings;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface SavingsMoveRepository extends JpaRepository<SavingsMove, Long> {
    List<SavingsMove> findByDateBetween(LocalDate start, LocalDate end);
}
