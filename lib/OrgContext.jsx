"use client";
import { createContext, useContext, useMemo, useState } from "react";

const OrgContext = createContext({
  org: null,
  setOrg: () => {},
  organizations: [],
  setOrganizations: () => {},
});

export function OrgProvider({ children, initialOrg = null, initialOrganizations = [] }) {
  const [org, setOrg] = useState(initialOrg);
  const [organizations, setOrganizations] = useState(initialOrganizations);
  const value = useMemo(() => ({ org, setOrg, organizations, setOrganizations }), [org, organizations]);
  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg() {
  return useContext(OrgContext);
}

export default OrgContext;