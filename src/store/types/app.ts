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

type RequestOptions = {
  errorCodeCallBack?: (message?: string) => void;
  changeLoading?: (value: boolean) => void;
};

export interface AppActions {
  fetchCitiesAndProfession: ({
    options,
  }: {
    options?: RequestOptions;
  }) => Promise<{ success: boolean }>;
}
