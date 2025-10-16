package com.finanzas.accounts;

import com.finanzas.common.ConflictException;
import com.finanzas.common.Constants;
import com.finanzas.common.NotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AccountService {
    private final AccountRepository repo;

    @Transactional(readOnly = true)
    public List<AccountDto.View> list() {
        return repo.findAll().stream().map(AccountDto::toView).toList();
    }

    @Transactional
    public AccountDto.View create(AccountDto.Create body) {
        if (repo.existsByNameIgnoreCase(body.name)) {
            throw new ConflictException(Constants.ERR_ACCOUNT_EXISTS);
        }
        Account a = new Account();
        a.setName(body.name.trim());
        a.setInitialBalance(java.math.BigDecimal.valueOf(body.initialBalance == null ? 0.0 : body.initialBalance));
        if (body.type != null) {
            try { a.setType(Account.Type.valueOf(body.type.toUpperCase())); } catch (Exception ignored) {}
        }
        repo.save(a);
        return AccountDto.toView(a);
    }

    @Transactional
    public AccountDto.View update(Long id, AccountDto.Update body) {
        Account a = repo.findById(id).orElseThrow(NotFoundException::new);
        if (body.name != null) a.setName(body.name.trim());
        if (body.initialBalance != null) a.setInitialBalance(java.math.BigDecimal.valueOf(body.initialBalance));
        if (body.type != null) {
            try { a.setType(Account.Type.valueOf(body.type.toUpperCase())); } catch (Exception ignored) {}
        }
        repo.save(a);
        return AccountDto.toView(a);
    }

    @Transactional
    public void delete(Long id) {
        if (!repo.existsById(id)) throw new NotFoundException();
        repo.deleteById(id);
    }
}
