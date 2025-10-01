package com.finanzas.accounts;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {
    Optional<Account> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
}

