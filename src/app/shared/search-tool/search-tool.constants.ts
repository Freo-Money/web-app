export interface SearchResourceOption {
  name: string;
  value: string;
}

export const SEARCH_RESOURCE_OPTIONS: SearchResourceOption[] = [
  { name: 'All', value: 'clients,clientIdentifiers,groups,savings,shares,loans' },
  { name: 'Loans', value: 'loans' },
  { name: 'Clients', value: 'clients,clientIdentifiers' },
  { name: 'Groups', value: 'groups' },
  { name: 'Savings', value: 'savings' },
  { name: 'Shares', value: 'shares' }
];

export const DEFAULT_SEARCH_RESOURCE = SEARCH_RESOURCE_OPTIONS[1].value;
