export interface ICity {
  id: string;
  name: string;
  country: string;
}

export interface IProfession {
  id: string;
  name: string;
}

export interface App {
  cities: ICity[];
  professions: IProfession[];
}

export interface AppState {
  app: App;
}

export interface AppActions {
  fetchCitiesAndProfession: (
    setAlertMessage?: (message: string | undefined | null) => void,
    changeLoading?: (value: boolean) => void,
  ) => Promise<{ success: boolean }>;
}
