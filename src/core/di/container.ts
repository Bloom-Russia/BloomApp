import 'reflect-metadata';
import { AuthRepositoryImpl } from '@data/repositories/AuthRepositoryImpl';
import { NotificationRepositoryImpl } from '@data/repositories/NotificationRepositoryImpl';
import { SecureStorageRepositoryImpl } from '@data/repositories/SecureStorageRepositoryImpl';
import { IAuthRepository } from '@domain/repositories/IAuthRepository';
import { INotificationRepository } from '@domain/repositories/INotificationRepository';
import { ISecureStorageRepository } from '@domain/repositories/ISecureStorageRepository';
import { AuthStore } from '@stores/AuthStore';
import { NotificationStore } from '@stores/NotificationStore';
import { RootStore } from '@stores/RootStore';
import { Container } from 'inversify';

const container = new Container({ defaultScope: 'Singleton' });

// Регистрируем репозитории
container
  .bind<ISecureStorageRepository>('ISecureStorageRepository')
  .to(SecureStorageRepositoryImpl);
container.bind<IAuthRepository>('IAuthRepository').to(AuthRepositoryImpl);
container.bind<INotificationRepository>('INotificationRepository').to(NotificationRepositoryImpl);

// Регистрируем Stores
container.bind<AuthStore>(AuthStore).toSelf();
container.bind<NotificationStore>(NotificationStore).toSelf();
container.bind<RootStore>(RootStore).toSelf();

export { container };
