#!/bin/bash

echo "🔄 MoneyTracker APK 재빌드 시작..."

# 1. 웹 파일을 www 폴더로 복사
echo "📁 웹 파일 복사 중..."
cp *.html *.css *.js *.json www/
cp -r icons www/

# 2. Capacitor 동기화
echo "🔄 Capacitor 동기화 중..."
npx cap sync android

# 3. APK 빌드
echo "🔨 APK 빌드 중..."
cd android
./gradlew assembleDebug

# 4. APK 파일을 데스크톱으로 복사
echo "📱 APK 파일 복사 중..."
cp app/build/outputs/apk/debug/app-debug.apk ~/Desktop/MoneyTracker-$(date +%Y%m%d-%H%M%S).apk

echo "✅ APK 재빌드 완료!"
echo "📱 파일 위치: ~/Desktop/MoneyTracker-$(date +%Y%m%d-%H%M%S).apk"
