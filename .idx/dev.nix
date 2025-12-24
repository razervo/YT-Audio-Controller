{ pkgs, ... }: {
  # Use a stable channel for consistency
  channel = "stable-23.11";

  # Install only the essential tools
  packages = [
    pkgs.jdk17             # Standard Java 17 for Android
    pkgs.android-tools     # Android SDK tools
    pkgs.gradle            # Build engine
  ];

  # Force the system to recognize Java and Android paths
  env = {
    JAVA_HOME = "${pkgs.jdk17}";
    ANDROID_HOME = "/home/user/Android/Sdk";
    # Prevent Gradle background errors
    GRADLE_OPTS = "-Dorg.gradle.daemon=false -Dorg.gradle.vfs.watch=false";
  };

  idx = {
    # Load the necessary extensions
    extensions = [
      "vscjava.vscode-java-pack"
      "vscjava.vscode-gradle"
      "ms-python.python"
    ];

    # Setup the workspace when it is first created
    workspace = {
      # This hook runs only once on creation
      onCreate = {
        # This command manually forces the Java Home into the VS Code settings
        setup-java = "mkdir -p .vscode && echo '{\"java.jdt.ls.java.home\": \"${pkgs.jdk17}\", \"java.configuration.runtimes\": [{\"name\": \"JavaSE-17\", \"path\": \"${pkgs.jdk17}\", \"default\": true}]}' > .vscode/settings.json";
      };
    };

    # Enable the Android preview panel
    previews = {
      enable = true;
      previews = {
        android = {
          command = [ "./gradlew" "clean" "assembleDebug" "--no-daemon" ];
          manager = "android";
        };
      };
    };
  };
}