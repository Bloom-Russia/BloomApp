// AppDelegate.swift

import UIKit
import Firebase
import FirebaseMessaging
import UserNotifications
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate, MessagingDelegate {
    var window: UIWindow?

    var reactNativeDelegate: ReactNativeDelegate?
    var reactNativeFactory: RCTReactNativeFactory?

    func application(_ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        // Инициализация Firebase
        FirebaseApp.configure()

        // Настройка уведомлений
        setupPushNotifications(application)

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

        // Проверка, было ли приложение запущено по уведомлению
        checkForNotificationLaunch(launchOptions)

        return true
    }

    // MARK: - Push Notifications Setup

    private func setupPushNotifications(_ application: UIApplication) {
        // Назначение делегатов
        Messaging.messaging().delegate = self
        UNUserNotificationCenter.current().delegate = self

        // Запрос разрешений
        let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
        UNUserNotificationCenter.current().requestAuthorization(options: authOptions) {
            granted, error in
            if let error = error {
                print("Ошибка запроса разрешений: \(error)")
            }
            print("Разрешения на уведомления: \(granted)")
        }

        application.registerForRemoteNotifications()

        // Настройка direct channel (для foreground)
        Messaging.messaging().isAutoInitEnabled = true
    }

    // MARK: - APNs Token Handling

    func application(_ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        // Преобразование токена в строку
        let tokenParts = deviceToken.map {
            data in String(format: "%02.2hhx", data)
        }
        let token = tokenParts.joined()
        print("APNs Device Token: \(token)")

        // Передача токена в Firebase
        Messaging.messaging().apnsToken = deviceToken
    }

    func application(_ application: UIApplication,
    didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("Не удалось зарегистрироваться для удаленных уведомлений: \(error)")
    }

    // MARK: - MessagingDelegate Methods

    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        print("FCM Token получен: \(fcmToken ?? "nil")")

        // Сохраняем токен локально или отправляем на сервер
        if let token = fcmToken {
            UserDefaults.standard.set(token, forKey: "fcmToken")

            // Можно отправить токен на ваш сервер
            sendTokenToServer(token)
        }
    }

    // MARK: - UNUserNotificationCenterDelegate Methods

    // Вызывается, когда уведомление получено в foreground
    func userNotificationCenter(_ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        let userInfo = notification.request.content.userInfo

        print("Уведомление получено в foreground: \(userInfo)")

        // Обработка данных уведомления
        handleNotificationData(userInfo, isForeground: true)

        // Показываем уведомление даже в foreground
        if #available(iOS 14.0, *) {
            completionHandler([.banner, .badge, .sound])
        } else {
            completionHandler([.alert, .badge, .sound])
        }
    }

    // Вызывается, когда пользователь нажимает на уведомление
    func userNotificationCenter(_ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void) {
        let userInfo = response.notification.request.content.userInfo

        print("Пользователь нажал на уведомление: \(userInfo)")

        // Обработка данных уведомления
        handleNotificationData(userInfo, isForeground: false)

        // Уведомляем React Native о нажатии
        NotificationCenter.default.post(
            name: NSNotification.Name("NotificationOpened"),
            object: nil,
            userInfo: userInfo
        )

        completionHandler()
    }

    // MARK: - Helper Methods

    private func sendTokenToServer(_ token: String) {
        // Здесь реализуйте отправку токена на ваш сервер
        // Используйте AxiosService или другой HTTP клиент
        print("Отправка FCM токена на сервер: \(token)")
    }

    private func handleNotificationData(_ userInfo: [AnyHashable: Any], isForeground: Bool) {
        // Преобразование данных уведомления
        let notificationData = userInfo as? [String: Any] ?? [:]

        // Отправляем данные в React Native
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

        // Если есть поле content-available: 1, обрабатываем фоновое обновление
        if let aps = userInfo["aps"] as? [String: Any],
        let contentAvailable = aps["content-available"] as? Int,
        contentAvailable == 1 {
            print("Фоновое обновление получено")

            // Здесь можно обработать фоновое обновление данных
            DispatchQueue.main.async {
                NotificationCenter.default.post(
                    name: NSNotification.Name("BackgroundDataReceived"),
                    object: nil,
                    userInfo: notificationData
                )
            }
        }
    }

    private func checkForNotificationLaunch(_ launchOptions: [UIApplication.LaunchOptionsKey: Any]?) {
        // Проверка, было ли приложение запущено по уведомлению
        if let notification = launchOptions?[.remoteNotification] as? [String: Any] {
            print("Приложение запущено по уведомлению: \(notification)")
            handleNotificationData(notification, isForeground: false)
        }
    }

    // MARK: - App Lifecycle

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Сбрасываем бейдж при активации приложения
        application.applicationIconBadgeNumber = 0
    }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
    override func sourceURL(for bridge: RCTBridge) -> URL? {
        self.bundleURL()
    }

    override func bundleURL() -> URL? {
        #if DEBUG
        return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
        #else
        return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
        #endif
    }

//    // ✅ ПРАВИЛЬНОЕ РАСПОЛОЖЕНИЕ МЕТОДА customize
//    override func customize(_ rootView: RCTRootView) {
//        super.customize(rootView)
//
//        // Убедитесь, что имя storyboard соответствует файлу в проекте
//        #if canImport(RNBootSplash)
//        RNBootSplash.initWithStoryboard("BootSplash", rootView: rootView)
//        #else
//        print("RNBootSplash не доступен")
//        #endif
//    }
}
