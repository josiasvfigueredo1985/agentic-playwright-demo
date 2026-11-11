Atue como um Engenheiro de QA Sênior especializado em Spec-Driven Testing (SDD) e automação com Playwright. Crie do zero uma suíte completa de testes automatizados para o Sauce Labs Demo (`https://saucedemo.com`) seguindo exatamente estes passos no terminal e no workspace:

### Fase 1: Setup do Projeto e Playwright CLI
1. Inicialize um projeto Node.js (`npm init -y`) e instale o Playwright Test (`npm install -D @playwright/test @types/node`) e os navegadores necessários (`npx playwright install chromium`).
2. Instale o Playwright CLI globalmente (`npm install -g @playwright/cli@latest`) e instale suas skills nativas (`playwright-cli install --skills`).
3. Garanta que as skills instaladas do `playwright-cli` fiquem acessíveis em `.github/skills/playwright-cli/` para que o GitHub Copilot as reconheça nativamente.
4. Crie o arquivo `playwright.config.ts` configurado para rodar em Chromium, com `baseURL: 'https://saucedemo.com'`, `testIdAttribute: 'data-test'`, screenshots em caso de falha e relatório HTML.

### Fase 2: Criação da Skill Spec-Driven
5. Crie o arquivo `.github/skills/spec-driven-playwright/SKILL.md` com instruções claras para:
   - Ler especificações em `specs/*.spec.md`.
   - Explorar e validar os cenários no navegador real usando `playwright-cli open`, `playwright-cli snapshot` e comandos de interação antes de escrever código.
   - Gerar arquivos de teste limpos em `tests/*.spec.ts` usando Page Object Model (POM) ou seletores resilientes (`getByTestId`, `getByRole`, `getByPlaceholder`).
   - Executar `npx playwright test` para comprovar que a suíte passa e encerrar a sessão com `playwright-cli close`.

### Fase 3: Especificação Funcional (Spec)
6. Crie o arquivo `specs/saucedemo.spec.md` detalhando os critérios de aceite em formato BDD (Dado/Quando/Então) para:
   - **Cenário 1 (Login válido):** Autenticar com `standard_user` / `secret_sauce` e validar redirecionamento para `/inventory.html`.
   - **Cenário 2 (Usuário bloqueado):** Tentar logar com `locked_out_user` / `secret_sauce` e validar a mensagem de bloqueio.
   - **Cenário 3 (Ordenação de catálogo):** Logar, ordenar produtos por "Price (low to high)" e validar que o primeiro item é o mais barato ($7.99).
   - **Cenário 4 (Fluxo completo de Checkout E2E):** Adicionar "Sauce Labs Backpack" ao carrinho, ir ao carrinho, fazer checkout preenchendo Nome, Sobrenome e CEP, finalizar compra e validar "Thank you for your order!".

### Fase 4: Execução Real e Geração da Suíte
7. Siga a skill que você acabou de criar: use o `playwright-cli` no terminal para abrir `https://saucedemo.com`, inspecionar os elementos reais via snapshot e validar os fluxos.
8. Crie a estrutura de Page Objects em `pages/` (ex: `LoginPage.ts`, `InventoryPage.ts`, `CartPage.ts`, `CheckoutPage.ts`) e a suíte de testes em `tests/saucedemo.spec.ts`.
9. Execute `npx playwright test` no terminal, corrija qualquer falha se houver até que 100% dos testes passem, feche o navegador do CLI (`playwright-cli close`) e me apresente a estrutura final de arquivos criada.

