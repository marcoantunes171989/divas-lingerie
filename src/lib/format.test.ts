import { describe, it, expect } from "vitest";
import { dateBR } from "./format";

describe("dateBR", () => {
  it("formata data simples YYYY-MM-DD", () => {
    expect(dateBR("2026-06-01")).toBe("01/06/2026");
  });

  it("formata timestamp ISO completo (bug da consignação)", () => {
    expect(dateBR("2026-06-01T00:00:00+00:00")).toBe("01/06/2026");
    expect(dateBR("2026-12-25T13:45:30.000Z")).toBe("25/12/2026");
  });

  it("retorna vazio para entrada vazia", () => {
    expect(dateBR("")).toBe("");
  });

  it("não quebra com entrada inesperada", () => {
    expect(dateBR("texto-invalido")).toBe("texto-invalido");
  });
});
