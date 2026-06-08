// AppDelegate.swift - исправленная версия

import UIKit
import Firebase
import FirebaseMessaging
import UserNotifications
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    var reactNativeDelegate: ReactNativeDelegate?
    var reactNativeFactory: RCTReactNativeFactory?

    // Добавьте это свойство
    private var fcmMessageHandlingCompletion: ((UIBackgroundFetchResult) -> Void)?

    func application(_ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {

        // 1. Инициализация Firebase (должна быть первой)
        FirebaseApp.configure()

        // 2. Настройка уведомлений ДО React Native
        setupPushNotifications(application)

        // 3. Инициализация React Native
        let delegate = ReactNativeDelegate()
        let factory = RCTReactNativeFactory(delegate: delegate)
        delegate.dependencyProvider = RCTAppDependencyProvider()

        reactNativeDelegate = delegate
        reactNativeFactory = factory

        window = UIWindow(frame: UIScreen.main.bounds)

        factory.startReactNative(
            withModuleName: "BloomApp",
            in: window,
            launchOptions: launchOptions
        )

        // 4. Проверка запуска по уведомлению
        if let notification = launchOptions?[.remoteNotification] as? [String: Any] {
            print("📱 Приложение запущено по уведомлению: \(notification)")
            handleNotificationData(notification, isForeground: false)
        }

        return true
    }

    // MARK: - Настройка Push Notifications

    private func setupPushNotifications(_ application: UIApplication) {
        print("🔧 Настройка push уведомлений...")

        // 1. Назначение делегатов ДО запроса разрешений
        UNUserNotificationCenter.current().delegate = self
        Messaging.messaging().delegate = self

        // 2. Запрос разрешений
        let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound, .providesAppNotificationSettings]

        UNUserNotificationCenter.current().requestAuthorization(options: authOptions) { granted, error in
            if let error = error {
                print("❌ Ошибка запроса разрешений: \(error.localizedDescription)")
                return
            }

            print("✅ Разрешения на уведомления: \(granted)")

            // 3. Регистрация для удаленных уведомлений
            DispatchQueue.main.async {
                application.registerForRemoteNotifications()
            }
        }

        // 4. Настройка прямого канала
        Messaging.messaging().isAutoInitEnabled = true

        // 5. Важно для iOS: установка метода доставки
        if #available(iOS 10.0, *) {
            let center = UNUserNotificationCenter.current()
            center.delegate = self
        }
    }

    // MARK: - APNs Token Handling

    func application(_ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        let tokenParts = deviceToken.map { data in String(format: "%02.2hhx", data) }
        let token = tokenParts.joined()
        print("✅ APNs Device Token: \(token)")

        // КРИТИЧЕСКИ ВАЖНО: Передача токена в Firebase
        Messaging.messaging().apnsToken = deviceToken

        // Также отправляем токен в FCM
        Messaging.messaging().setAPNSToken(deviceToken, type: .unknown)
    }

    func application(_ application: UIApplication,
    didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("❌ Не удалось зарегистрироваться для удаленных уведомлений: \(error.localizedDescription)")
    }

    // MARK: - Обработка фоновых обновлений

    func application(_ application: UIApplication,
    didReceiveRemoteNotification userInfo: [AnyHashable: Any],
    fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {

        print("📱 Получено remote notification в фоне: \(userInfo)")

        // Сохраняем completion handler
        self.fcmMessageHandlingCompletion = completionHandler

        // Обработка данных уведомления
        handleNotificationData(userInfo, isForeground: false)

        // Сообщаем системе о результате
        completionHandler(.newData)
    }

    // MARK: - App Lifecycle

    func applicationDidBecomeActive(_ application: UIApplication) {
        application.applicationIconBadgeNumber = 0
        UNUserNotificationCenter.current().removeAllDeliveredNotifications()
    }
}

// MARK: - UNUserNotificationCenterDelegate

extension AppDelegate: UNUserNotificationCenterDelegate {

    // Вызывается при получении уведомления в foreground
    func userNotificationCenter(_ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {

        let userInfo = notification.request.content.userInfo
        print("📱 Уведомление получено в foreground: \(userInfo)")

        // Обработка данных уведомления
        handleNotificationData(userInfo, isForeground: true)

        // Для iOS 14+
        if #available(iOS 14.0, *) {
            completionHandler([.banner, .badge, .sound, .list])
        } else {
            completionHandler([.alert, .badge, .sound])
        }
    }

    // Вызывается при нажатии на уведомление
    func userNotificationCenter(_ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void) {

        let userInfo = response.notification.request.content.userInfo
        print("📱 Пользователь нажал на уведомление: \(userInfo)")

        // Обработка данных уведомления
        handleNotificationData(userInfo, isForeground: false)

        // Уведомляем React Native
        DispatchQueue.main.async {
            NotificationCenter.default.post(
                name: NSNotification.Name("NotificationOpened"),
                object: nil,
                userInfo: userInfo
            )
        }

        completionHandler()
    }
}

// MARK: - MessagingDelegate

extension AppDelegate: MessagingDelegate {

    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        print("✅ FCM Token получен: \(fcmToken ?? "nil")")

        guard let token = fcmToken else { return }

        // Сохраняем токен
        UserDefaults.standard.set(token, forKey: "fcmToken")

        // Отправляем в React Native
        DispatchQueue.main.async {
            NotificationCenter.default.post(
                name: NSNotification.Name("FCMTokenReceived"),
                object: nil,
                userInfo: ["token": token]
            )
        }

        // Отправка токена на ваш сервер
        sendTokenToServer(token)
    }

    // MARK: - Helper Methods

    private func sendTokenToServer(_ token: String) {
        print("📤 Отправка FCM токена на сервер: \(token)")
        // Реализуйте отправку на ваш бэкенд
    }

    private func handleNotificationData(_ userInfo: [AnyHashable: Any], isForeground: Bool) {
        let notificationData = userInfo as? [String: Any] ?? [:]

        print("📱 Обработка данных уведомления: \(notificationData)")

        // Отправляем в React Native
        DispatchQueue.main.async {
            NotificationCenter.default.post(
                name: NSNotification.Name("FCMNotificationReceived"),
                object: nil,
                userInfo: [
                    "data": notificationData,
                    "isForeground": isForeground
                ]
            )
        }

        // Обработка фонового обновления
        if let aps = userInfo["aps"] as? [String: Any],
        let contentAvailable = aps["content-available"] as? Int,
        contentAvailable == 1 {

            print("📱 Фоновое обновление получено")

            DispatchQueue.main.async {
                NotificationCenter.default.post(
                    name: NSNotification.Name("SilentPushReceived"),
                    object: nil,
                    userInfo: notificationData
                )
            }

            // Вызываем completion handler если есть
            fcmMessageHandlingCompletion?(.newData)
            fcmMessageHandlingCompletion = nil
        }
    }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
    override func sourceURL(for bridge: RCTBridge) -> URL? {
        return self.bundleURL()
    }

    override func bundleURL() -> URL? {
        #if DEBUG
        return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
        #else
        return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
        #endif
    }
}
