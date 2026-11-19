# Publish an Android release

Build from the repository root on Windows with Node, Android Studio, Android SDK 35 and SDK Build-Tools installed.

1. Configure the deployed API and check that a physical phone can reach its HTTPS origin. Set `VITE_MOBILE_API_ORIGIN` in the build environment to that exact origin, without a path or trailing slash.
2. Use the publisher's release keystore. For a first release, its owner can create a keystore with Android Studio's **Generate Signed Bundle / APK** wizard and back up the key and credentials. Every update to the public app must use the same signing key.
3. Supply the four settings below as environment variables or in the Git-ignored `android/keystore.properties` file using `NAME=value` lines. Environment variables take precedence. Use forward slashes for Windows paths in the properties file.

   | Setting | Value |
   | --- | --- |
   | `UNISERVE_STORE_FILE` | Absolute keystore path or a path relative to `android/` |
   | `UNISERVE_STORE_PASSWORD` | Keystore password |
   | `UNISERVE_KEY_ALIAS` | Release signing key alias |
   | `UNISERVE_KEY_PASSWORD` | Password for that key |

4. Set `versionName` and `versionCode` in `android/app/build.gradle`. Increase the integer code for each update. The public package is `ph.edu.buksu.uniserve`. The local pilot installs separately as `ph.edu.buksu.uniserve.dev`.
5. Run `npm.cmd ci` followed by `npm.cmd run android:release`. A successful build verifies the APK signature and writes `android/app/build/distributions/UniServe.apk`. Compare the printed signer certificate SHA-256 digest with the publisher's recorded fingerprint. Record the separate APK SHA-256 hash for this release.
6. Install that file on a physical phone and check sign-in and a representative request using mobile data. For an update, install over the previous public APK and confirm the app opens with its existing data.
7. Create a GitHub Release in `Yosores04/UniServe` with a tag matching the version (for example, `v0.1.0`). Attach the verified file as **UniServe.apk**, include its SHA-256 hash in the notes, publish it as a stable release and mark it latest. Open the landing page from a phone and verify that its download installs.
