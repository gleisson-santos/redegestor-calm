import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/encargos")({
  component: EncargosLayout,
});

function EncargosLayout() {
  return <Outlet />;
}