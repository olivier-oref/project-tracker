import { resolveOwner, ownerKey, ownerLabel, ownerSuggestions } from "./owners";

const members = [
  { id: "u1", name: "Olivier Marschalik" },
  { id: "u2", name: "Felipe" },
];

describe("resolveOwner", () => {
  it("links a member by name, any case, trimmed", () => {
    expect(resolveOwner("  olivier MARSCHALIK ", members)).toEqual({ ownerId: "u1", ownerName: null });
  });

  it("links a member picked with the pending suffix", () => {
    expect(resolveOwner("Felipe (pending)", members)).toEqual({ ownerId: "u2", ownerName: null });
  });

  it("keeps any other name as typed (trimmed), unlinked", () => {
    expect(resolveOwner("  Dana from Legal ", members)).toEqual({ ownerId: null, ownerName: "Dana from Legal" });
  });

  it("clears the owner for empty or missing input", () => {
    expect(resolveOwner("", members)).toEqual({ ownerId: null, ownerName: null });
    expect(resolveOwner("   ", members)).toEqual({ ownerId: null, ownerName: null });
    expect(resolveOwner(null, members)).toEqual({ ownerId: null, ownerName: null });
  });

  it("caps very long names", () => {
    expect(resolveOwner("x".repeat(500), members).ownerName).toHaveLength(80);
  });
});

describe("ownerKey / ownerLabel", () => {
  it("keys members by id and outsiders by lower-cased name", () => {
    expect(ownerKey({ ownerId: "u1", ownerName: null })).toBe("u:u1");
    expect(ownerKey({ ownerId: null, ownerName: "Dana" })).toBe("n:dana");
    expect(ownerKey({ ownerId: null, ownerName: null })).toBe("");
  });

  it("labels members by their name and outsiders by the typed name", () => {
    expect(ownerLabel({ ownerId: "u2", ownerName: null }, members)).toBe("Felipe");
    expect(ownerLabel({ ownerId: null, ownerName: "Dana" }, members)).toBe("Dana");
    expect(ownerLabel({ ownerId: null, ownerName: null }, members)).toBe("");
  });
});

describe("ownerSuggestions", () => {
  it("lists members first, then distinct outsider names already used, without duplicates", () => {
    const tasks = [
      { ownerId: null, ownerName: "Dana" },
      { ownerId: null, ownerName: "dana" },
      { ownerId: "u1", ownerName: null },
      { ownerId: null, ownerName: "Bob" },
    ];
    expect(ownerSuggestions(members, tasks)).toEqual(["Olivier Marschalik", "Felipe", "Bob", "Dana"]);
  });
});
