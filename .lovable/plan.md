

## Gerar proposta comercial em PDF

Documento profissional para você apresentar ao seu gestor, no modelo híbrido (entrega + manutenção mensal), com escopo, valores e condições prontos.

### Conteúdo do PDF

1. **Capa**: título "Proposta Comercial — Sistema RedeGestor", nome do projeto, data, validade da proposta (30 dias).
2. **Sumário executivo**: o que é o RedeGestor em 1 parágrafo, problema que resolve, benefícios para a operação.
3. **Escopo entregue**: lista de módulos já implementados (Dashboard, Obras, URs, Alvarás, Materiais, Mapa, Diário de Obra, Caderno de Encargos, Lançamentos, Medições Mensais, Relatórios, Consolidado, Gestão de Usuários, PDF Executivo).
4. **Stack tecnológica**: React + TanStack Start, Supabase (Postgres + Auth + RLS), Cloudflare Workers, domínio personalizado — apresentado em linguagem acessível.
5. **Investimento**:
   - Setup e entrega: **R$ 18.000** (parcelável em até 3x)
   - Manutenção mensal: **R$ 800/mês**
   - Hora avulsa para novas funcionalidades: **R$ 180/h**
6. **O que está incluso na entrega**: configuração do sistema, migração de dados existentes, treinamento de 4h, documentação, configuração de domínio e infraestrutura.
7. **O que está incluso na manutenção**: hospedagem (Supabase + Cloudflare), suporte em horário comercial, correção de bugs, até 5h/mês de pequenos ajustes, atualizações de segurança.
8. **O que não está incluso**: novas funcionalidades grandes, integrações com sistemas terceiros, consultoria estratégica — orçados à parte.
9. **Cronograma**: entrega em até 15 dias úteis após aprovação (sistema já está pronto, apenas configuração final + treinamento).
10. **Condições comerciais**: forma de pagamento, validade, vigência mínima da manutenção (12 meses sugerido), reajuste anual por IPCA.
11. **Sobre a propriedade**: dados sempre pertencem ao cliente; código permanece sob licença de uso enquanto vigente o contrato de manutenção.
12. **Assinatura**: campos para você e o gestor.

### Estilo visual

- A4 retrato, margens 1 polegada
- Tipografia limpa (Helvetica), preto sobre branco
- Cabeçalho com faixa azul sutil em cada seção
- Tabela de investimento destacada
- Rodapé com numeração de páginas

### Implementação técnica

- Script Python com `reportlab` (Platypus) gerando o PDF diretamente em `/mnt/documents/proposta-redegestor.pdf`.
- QA visual obrigatório: converter cada página para JPG e inspecionar antes de entregar.
- Entregue como `<lov-artifact>` para download imediato.

### Resultado esperado

Você recebe um PDF de 4–6 páginas, profissional, pronto para imprimir ou enviar por email ao gestor, com todos os números e condições já consolidados conforme a recomendação da conversa anterior.

