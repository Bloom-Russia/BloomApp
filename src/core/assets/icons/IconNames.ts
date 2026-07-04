export enum IconNames {
  /** Иконка Face ID */
  faceId = 'faceid',
  /** Иконка отпечатка пальца */
  fingerprint = 'fingerprint',
  /** Выход */
  signOut = 'signout',
  /** Отмена / закрыть */
  cancel = 'cancel',
  /** Обновить */
  reload = 'reload',
  /** Предупреждение */
  warning = 'warning',
  /** Информация */
  info = 'info',
  /** Ошибка */
  error = 'error',
  /** Успех */
  success = 'success',
  /** Помощь */
  help = 'help',
  /** Backspace */
  backspace = 'backspace',
  /** Пользователь */
  user = 'user',
  /** Календарь */
  calendar = 'calendar',
  /** Поиск */
  search = 'search',
  /** Стрелка вниз */
  chevronDown = 'chevron-down',
  /** Галочка (выбрано) */
  checked = 'checked',
  /** Редактирование */
  edit = 'edit',
  /** Вопрос */
  question = 'question',
  /** Блокнот */
  notebook = 'notebook',
  /** Профиль */
  profile = 'profile',
  /** Домой */
  home = 'home',
  /** Чат */
  chat = 'chat',
  /** Плюс */
  plus = 'plus',
  /** Назад */
  back = 'back',
  /** Часы */
  clock = 'clock',
}

/**
 * Тип для имени иконки
 */
export type IconName = keyof typeof IconNames;
