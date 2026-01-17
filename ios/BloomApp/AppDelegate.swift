import UIKit
import React
import Firebase
import RNBootSplash

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?
    var bridge: RCTBridge!

    func application(_ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {

        // Инициализация Firebase
        FirebaseApp.configure()

        // Инициализация bridge
        self.bridge = RCTBridge(delegate: self, launchOptions: launchOptions)

        // Создание окна
        window = UIWindow(frame: UIScreen.main.bounds)

        // Создание rootView с использованием bridge
        let rootView = RCTRootView(
            bridge: self.bridge,
            moduleName: "BloomApp",
            initialProperties: nil
        )

        // Настройка rootViewController
        let rootViewController = UIViewController()
        rootViewController.view = rootView
        window?.rootViewController = rootViewController
        window?.makeKeyAndVisible()

        // Инициализация BootSplash
        RNBootSplash.initWithStoryboard("BootSplash", rootView: rootView)

        return true
    }

    func application(_ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        Messaging.messaging().apnsToken = deviceToken
    }
}

// MARK: - RCTBridgeDelegate
extension AppDelegate: RCTBridgeDelegate {
    func sourceURL(for bridge: RCTBridge!) -> URL! {
        #if DEBUG
        return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
        #else
        return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
        #endif
    }

    // Опционально: дополнительные конфигурации для bridge
    func extraModules(for bridge: RCTBridge!) -> [RCTBridgeModule]! {
        return []
    }

    func shouldBridgeUseJSCExecutor(_ bridge: RCTBridge!) -> Bool {
        return false
    }
}
