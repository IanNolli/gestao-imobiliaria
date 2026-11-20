import { criarAplicacao } from "./app";

const { app, modulos } = criarAplicacao();
const porta = Number(process.env.PORT ?? 3000);

// Usuário inicial para testar a API (apenas protótipo).
await modulos.autenticacao.servico.cadastrar("admin@imobiliaria.com", "admin12345", "ADMIN");

app.listen(porta, () => {
  console.log(`Gestão Imobiliária rodando em http://localhost:${porta}`);
  console.log(`Login: POST /auth/login {"email":"admin@imobiliaria.com","senha":"admin12345"}`);
});
