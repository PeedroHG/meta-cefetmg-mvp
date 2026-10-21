import { resetDbToSeed } from "./local-store";

console.log("🌱 Populando banco de dados da 35ª META (CEFET-MG)...");
const state = resetDbToSeed();
console.log(
  `✅ Seed concluído com sucesso! ${state.projects.length} projetos, ${state.users.length} usuários, ${state.tags.length} tags e ${state.rewards.length} brindes criados.`
);
