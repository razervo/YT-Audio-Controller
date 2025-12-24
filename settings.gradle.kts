pluginManagement {
    repositories {
        google()            // <--- This is what was missing
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()            // <--- This is for the app libraries
        mavenCentral()
    }
}

rootProject.name = "YT Audio Pro"
include(":app")