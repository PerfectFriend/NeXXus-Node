<p align="center">
  <img src="assets/images/banner-top.jpg" alt="NeXXUs Sovereign Crypto-Cloud Hosting — Cyberpunk Gaudí Van Gogh Banner" width="100%" style="border-radius: 12px; box-shadow: 0 20px 50px rgba(0,0,0,0.6);" />
</p>

# 🌌 NeXXUs — Децентрализованное Криптооблако и Суверенная P2P Сеть Хранилищ

> **Суверенная Peer-to-Peer платформа для надёжного хранения конфиденциальных данных, секретов, ключей и приватных архивов, абсолютно независимая от облачных корпораций, датацентров и цензуры провайдеров.**

[![Wire Protocol](https://img.shields.io/badge/Wire_Protocol-v2.0.0_Big--Endian-06b6d4?style=for-the-badge&logo=wireguard)](PROTOCOL_WIRE_SPEC.md)
[![Zero-Knowledge](https://img.shields.io/badge/Security-Zero--Knowledge_ChaCha20--Poly1305-10b981?style=for-the-badge&logo=shield)](PROTOCOL_WIRE_SPEC.md)
[![Erasure Coding](https://img.shields.io/badge/Fault_Tolerance-Reed--Solomon_(4+2)_GF(2^8)-f59e0b?style=for-the-badge&logo=speedtest)](test/protocol.test.ts)
[![Golden Vectors](https://img.shields.io/badge/Golden_Vectors-113%2F113_PASS-8b5cf6?style=for-the-badge&logo=checkmarx)](nexxus-vectors/)
[![Tor Onion](https://img.shields.io/badge/Transport-Tor_v3_Onion_P2P-ec4899?style=for-the-badge&logo=torproject)](PROTOCOL_WIRE_SPEC.md)
[![Ubuntu Installer](https://img.shields.io/badge/Linux_Deploy-Ubuntu_One--Liner-E95420?style=for-the-badge&logo=ubuntu)](install.sh)
[![Windows Installer](https://img.shields.io/badge/Windows_Deploy-PowerShell_One--Liner-0078D6?style=for-the-badge&logo=windows)](install.ps1)
[![Android Installer](https://img.shields.io/badge/Android_Deploy-Termux_One--Liner-3DDC84?style=for-the-badge&logo=android)](scripts/install-android-termux.sh)

---

## 📑 Содержание

1. [Манифест и Ключевые Принципы](#-манифест-проекта)
2. [Архитектура и Математика Надежности](#-архитектура-и-математика-надежности)
3. [⚡ Быстрая Установка на Ubuntu прямо с GitHub](#-быстрая-установка-на-ubuntu-прямо-с-github)
4. [🪟 Установка на Windows (PowerShell One-Liner)](#-установка-на-windows-powershell-one-liner)
5. [📱 Установка на Android (Termux One-Liner)](#-установка-на-android-termux-one-liner)
6. [🛠️ Полный Справочник Команд CLI (`nexxusd`)](#️-полный-справочник-команд-cli-nexxusd)
7. [⚙️ Конфигурация и Параметры Окружения](#️-конфигурация-и-параметры-окружения)
8. [🌐 Руководство: Объединение Нескольких Ubuntu Хостов в Меш-Кластер](#-руководство-объединение-нескольких-ubuntu-хостов-в-меш-кластер)
9. [🗺️ Дорожная карта: Нативные версии для Windows и Android](#️-дорожная-карта-нативные-версии-для-windows-и-android)
10. [🤖 GitHub Actions и Автоматические Релизы](#-github-actions-и-автоматические-релизы)
11. [❓ FAQ и Решение Проблем](#-faq-и-решение-проблем)

---

## ⚡ Манифест Проекта

Современные централизованные облачные сервисы (AWS S3, Google Cloud, Cloudflare, Dropbox, 1Password) создают опасную зависимость:
* **Единая точка отказа (SPOF)**: блокировка аккаунта, санкции, отзыв домена или авария в ЦОД лишают вас доступа ко всем секретам.
* **Иллюзия приватности**: даже при наличии шифрования метаданные, IP-адреса, размеры файлов и частота обращений собираются и анализируются.
* **Уязвимость перед законами чужих юрисдикций**: судебные предписания и скрытые бэкдоры.

**NeXXUs заменяет серверы корпораций чистой математикой и P2P-сетью.** Ваши файлы не хранятся целиком ни на одном сервере в мире. Они квантуются на микро-блоки ровно по 16 KB, шифруются локально шифром **ChaCha20-Poly1305**, кодируются помехоустойчивыми матрицами **Reed-Solomon (4+2)** и рассеиваются по глобальному рою независимых хостинг-узлов через анонимную сеть **Tor v3**.

---

## 🏛️ Архитектура и Математика Надежности

```
   ┌────────────────────────────────────────────────────────────────────────┐
   │                         ВАШЕ УСТРОЙСТВО (КЛИЕНТ)                       │
   │  1. Вход: Мастер-мнемоника BIP-39 (12/24 слова)                        │
   │  2. Квантование данных на микро-чанки ровно по 16 KB (16,384 байт)     │
   │  3. Клиентское шифрование: ChaCha20-Poly1305 (AEAD, 256-бит, RFC 8439) │
   │  4. Кодирование стирания: Reed-Solomon (4+2) над полем Галуа GF(2^8)   │
   └───────────────────────────────────┬────────────────────────────────────┘
                                       │
                Шарды 1-6 (4 данных + 2 проверочных по 4 KB каждый)
                                       │
                                       ▼
   ┌────────────────────────────────────────────────────────────────────────┐
   │                       ДЕЦЕНТРАЛИЗОВАННЫЙ РОЙ P2P                       │
   │  • Анонимный транспорт: Tor v3 Onion (62-символьные адреса)            │
   │  • Kademlia 256-bit DHT с маршрутизацией по XOR-расстоянию             │
   │  • Anti-Outsource: верификация локального отклика диска (I/O < 50 мс)  │
   │  • Защита от монополий: ASN Herfindahl-Hirschman Index (HHI ≤ 2500)    │
   │  • Автономное самоисцеление (Self-Healing) при потере любых 2 нод      │
   └───────────────────────────────────┬────────────────────────────────────┘
                                       │
        ┌──────────────┬───────────────┼───────────────┬──────────────┐
        ▼              ▼               ▼               ▼              ▼
   [Нода #1: 4KB] [Нода #2: 4KB] [Нода #3: 4KB] [Нода #4: 4KB] [Нода #5: 4KB]
     (Германия)     (Бразилия)      (Исландия)       (Япония)       (Канада)
```

### 1. Квантование и Избыточное Кодирование Reed-Solomon (4+2)
* **Размер блока**: ровно `16,384 байта` (16 KB).
* **Матрица Вандермонда над $GF(2^8)$** с примитивным полиномом `0x11D` ($x^8 + x^4 + x^3 + x^2 + 1$).
* Каждый чанк расщепляется на **4 информационных шарда** и **2 проверочных шарда** (по 4,096 байт каждый).
* **Математическая гарантия**: для 100% восстановления исходного файла достаточно любых 4 из 6 шардов. Даже при физическом уничтожении двух серверов данные восстанавливаются bit-for-bit.

### 2. Клиентское Шифрование Zero-Knowledge (ChaCha20-Poly1305)
* Все данные шифруются **на клиенте до отправки в сеть**.
* Симметричный шифр **ChaCha20** с 256-битным ключом и аутентификацией сообщений **Poly1305** (RFC 8439).
* Узлы хранения видят только случайный шум. Оператор ноды не может узнать ни тип, ни имя, ни содержимое файла.

### 3. Proof-of-Retrievability (PoR) Аудит
* Рой непрерывно валидирует узлы случайными криптографическими запросами: $s \in \{0, 1\}^{256}$.
* Дедлайн вычисления ответа: **строго 3,000 мс** (фактическое время на NVMe: 1–4 мс).
* Попытка узла смухлевать или перенаправить трафик в медленное облако (AWS S3) приводит к превышению лимита задержки и немедленной дисквалификации с изъятием залога.

### 4. Экономическая Модель Защиты от Атак (Anti-Loop Invariant)
В протоколе заложена строгая математическая защита от Sybil-атак и накрутки наград за хранение собственных данных («атака закольцовки»):
$$\text{Fee}_{\text{writer}} (1.30) > \text{Reward}_{\text{storer}} (1.25)$$
$$\text{Net Yield} = \text{Reward} - \text{Fee} = 1.25 - 1.30 = -0.05 \text{ NEXX (строго отрицательно)}$$
Каждая попытка бесконечно фармить награды, сохраняя данные на собственных нодах, сжигает капитал атакующего.

---

## ⚡ Быстрая Установка на Ubuntu прямо с GitHub

Инсталляционный скрипт спроектирован так, чтобы после пуша проекта на GitHub вы могли развернуть ноду на любом количестве серверов Ubuntu (20.04, 22.04, 24.04 LTS) **одной консольной командой**.

### 🚀 Способ 1: Установка в одну строку через `curl | bash` (Рекомендуемый)

Выполните на сервере Ubuntu:

```bash
curl -fsSL https://raw.githubusercontent.com/PerfectFriend/NeXXus-Node/main/install.sh | bash
```

> 💡 **Что скрипт делает автоматически «из коробки»:**
> 1. Проверяет права `sudo` и аппаратные характеристики сервера (CPU, RAM, диск).
> 2. При отсутствии Node.js автоматически устанавливает последнюю LTS-версию (v20) из официального репозитория NodeSource.
> 3. Клонирует репозиторий в `/opt/nexxus` или обновляет его.
> 4. Собирает оптимизированный автономный бандл демона `dist/nexxusd.cjs`.
> 5. Устанавливает глобальный бинарник в `/usr/local/bin/nexxusd`.
> 6. Создает структуру каталогов `/var/lib/nexxus` (`chunks/`, `meta/`, `logs/`).
> 7. Применяет оптимизации ядра Linux через `/etc/sysctl.d/99-nexxus.conf` для максимального IOPS на NVMe-дисках.
> 8. Генерирует суверенный криптографический паспорт узла (`node_identity.json`) с парой ключей Ed25519 и адресом **Tor Onion v3**.
> 9. Устанавливает и запускает фоновую системную службу **systemd** (`nexxus-node.service`) с автозапуском при перезагрузке.

#### Установка с кастомными параметрами:
Вы можете сразу передать размер выделяемого диска, порт и адрес начального пира:
```bash
curl -fsSL https://raw.githubusercontent.com/PerfectFriend/NeXXus-Node/main/install.sh | bash -s -- --storage-gb=500 --port=3999 --peers=192.168.1.10:3999
```

---

### 📦 Способ 2: Установка через Debian-пакет (.deb)

Если вы предпочитаете стандартный пакетный менеджер Ubuntu:

```bash
# 1. Скачайте свежий .deb пакет из релизов
wget https://raw.githubusercontent.com/PerfectFriend/NeXXus-Node/main/public/packages/nexxus-node_latest_amd64.deb

# 2. Установите пакет в систему
sudo dpkg -i nexxus-node_latest_amd64.deb || sudo apt-get install -f -y

# 3. Инициализируйте паспорт ноды
nexxusd init

# 4. Включите и запустите службу
sudo systemctl enable --now nexxus-node
```

---

### 🔨 Способ 3: Установка из клонированного репозитория

```bash
git clone https://github.com/PerfectFriend/NeXXus-Node.git
cd NeXXus-Node
sudo bash install.sh
```

---

### 🚦 Управление системной службой на Ubuntu

```bash
# Проверить статус демона
sudo systemctl status nexxus-node

# Просмотр логов работы в реальном времени
sudo journalctl -u nexxus-node -f

# Перезапуск службы (например, после смены конфига)
sudo systemctl restart nexxus-node

# Остановка службы
sudo systemctl stop nexxus-node
```

---

## 🪟 Установка на Windows (PowerShell One-Liner)

Для машин под управлением Windows 10/11 доступен автоматический PowerShell-инсталлятор.

### Быстрая установка в 1 команду:
Откройте **PowerShell от имени Администратора** и выполните:

```powershell
irm https://raw.githubusercontent.com/PerfectFriend/NeXXus-Node/main/install.ps1 | iex
```

### Что делает скрипт:
1. Проверяет наличие Node.js (при отсутствии ставит тихий пакет Node.js LTS через `winget` или официальный MSI).
2. Загружает ядро демона в `$env:ProgramFiles\NeXXUs`.
3. Создает директорию хранилища `$env:ProgramData\NeXXUs`.
4. Регистрирует команды `nexxusd.cmd` и `nexxusd.ps1` и добавляет их в системную переменную `$env:PATH`.
5. Инициализирует паспорт ноды и Tor v3 Onion адрес.

### Проверка работы в Windows:
```powershell
# Проверка паспорта и готовности
nexxusd status

# Запуск демона в терминале
nexxusd serve

# Быстрый бенчмарк PoR
nexxusd test-por
```

---

## 📱 Установка на Android (Termux One-Liner)

Превратите любой Android-смартфон с быстрым накопителем UFS в полноценную P2P-ноду криптооблака.

### Установка в Termux в 1 команду:
Откройте приложение **Termux** на телефоне и вставьте:

```bash
curl -fsSL https://raw.githubusercontent.com/PerfectFriend/NeXXus-Node/main/scripts/install-android-termux.sh | bash
```

### Особенности работы на Android:
- **Wakelock**: скрипт автоматически вызывает `termux-wake-lock`, предотвращая засыпание процессора при блокировке экрана.
- **Хранилище**: по умолчанию выделяется 32 ГБ в `~/.nexxus-storage`.
- **Автозапуск**: при наличии пакета `Termux:Boot` демон автоматически поднимается при перезагрузке смартфона.

---

## 🛠️ Полный Справочник Команд CLI (`nexxusd`)

Утилита командной строки `nexxusd` предоставляет полный контроль над нодой:

| Команда | Описание | Пример вызова |
|---|---|---|
| `nexxusd serve` | Запуск P2P демона хранилища в фоновом/интерактивном режиме | `nexxusd serve --port=3999` |
| `nexxusd init` | Генерация суверенной крипто-идентичности, ключей и Tor Onion v3 | `nexxusd init` или с восстановлением: `nexxusd init --mnemonic="12 слов..."` |
| `nexxusd id` | Вывод паспорта ноды, открытого ключа Ed25519 и адреса Onion v3 | `nexxusd id` или `nexxusd id --json` |
| `nexxusd status` | Просмотр статуса ноды, занятого объема NVMe, пула и ранга сейфа | `nexxusd status` |
| `nexxusd peers` | Вывод списка всех подключенных активных меш-узлов и задержек RTT | `nexxusd peers` |
| `nexxusd peer add <IP:PORT>` | Подключение к удаленному узлу и взаимный обмен паспортами | `nexxusd peer add 192.168.1.50:3999` |
| `nexxusd test-por` | Запуск локального бенчмарка Proof-of-Retrievability (<3000 мс) | `nexxusd test-por` |
| `nexxusd test-interhost <IP:PORT>` | Полный 6-этапный P2P аудит сетевого взаимодействия с удаленным узлом | `nexxusd test-interhost 192.168.1.50:3999` |
| `nexxusd upload <file>` | Загрузка локального файла: нарезка на 16KB, RS (4+2) и рассеивание | `nexxusd upload /path/to/archive.tar.gz` |
| `nexxusd download <hash> <out>` | Сбор шардов из сети, восстановление через RS и дешифрование | `nexxusd download <sha256> /tmp/restored.bin` |
| `nexxusd logs [-n N]` | Просмотр структурированных записей операционного лога | `nexxusd logs -n 50` |
| `nexxusd benchmark` | Тестирование пропускной способности NVMe и скорости Merkle Tree | `nexxusd benchmark` |

---

## ⚙️ Конфигурация и Параметры Окружения

Основной файл конфигурации на Ubuntu располагается по пути:
`/etc/nexxus/nexxus.conf`

```ini
# Сетевой интерфейс и порт
NEXXUS_HOST=0.0.0.0
NEXXUS_PORT=3999

# Каталог данных и размер выделенного пула NVMe (в ГБ)
NEXXUS_DATA_DIR=/var/lib/nexxus
NEXXUS_STORAGE_GB=384

# Параметры надежности (Reed-Solomon)
NEXXUS_REED_SOLOMON_DATA=4
NEXXUS_REED_SOLOMON_PARITY=2
NEXXUS_CHUNK_SIZE_KB=16

# Начальные узлы для присоединения к сети (через запятую)
NEXXUS_BOOTSTRAP_PEERS=192.168.1.10:3999,192.168.1.20:3999

# Уровень логирования (debug, info, warn, error)
NEXXUS_LOG_LEVEL=info
```

Любой параметр можно переопределить через флаги CLI (например, `--port=4000`, `--storage-gb=500`).

---

## 🌐 Руководство: Объединение Нескольких Ubuntu Хостов в Меш-Кластер

Предположим, у вас есть 2 или 3 сервера Ubuntu (например, мини-ПК Beelink SER9, домашний сервер и VPS):

### Шаг 1: Установка на всех машинах
Выполните одну команду на каждом сервере:
```bash
curl -fsSL https://raw.githubusercontent.com/PerfectFriend/NeXXus-Node/main/install.sh | bash
```

### Шаг 2: Проверка паспортов узлов
На **Хосте 1** (IP: `192.168.1.10`):
```bash
nexxusd id
# Получите Node ID и Tor Onion v3 адрес
```

На **Хосте 2** (IP: `192.168.1.20`):
```bash
nexxusd id
```

### Шаг 3: Соединение узлов в сеть
На **Хосте 1** подключитесь к **Хосту 2**:
```bash
nexxusd peer add 192.168.1.20:3999
```
*Узлы обменяются криптографическими фреймами `NODE_ANNOUNCE`, добавят друг друга в таблицу маршрутизации Kademlia DHT и отобразятся в `nexxusd peers`.*

### Шаг 4: Межузловой тест 6-в-1
Запустите диагностический тест связи между серверами:
```bash
nexxusd test-interhost 192.168.1.20:3999
```
Тест проверит:
1. Определение ASN и локальной зоны.
2. Сетевой RTT фрейма PING/PONG.
3. Запрос Kademlia DHT (FIND_NODE).
4. Заливку тестового 16KB шарда на удаленный хост (`STORE_CHUNK`).
5. Скачивание шарда обратно с побитовой сверкой хеша (`FETCH_CHUNK`).
6. Удаленную криптографическую верификацию Proof-of-Retrievability (`POR_CHALLENGE`).

### Шаг 5: Реальное распределенное хранение файлов
На **Хосте 1**:
```bash
echo "Секретные данные корпоративного сейфа" > /tmp/backup.txt
nexxusd upload /tmp/backup.txt --peers=192.168.1.20:3999
```
Команда выведет `SHA-256` хеш файла и `Vault Key`.

На **Хосте 2** (или любой другой ноде сети):
```bash
nexxusd download <SHA-256_ХЕШ> /tmp/restored.txt --peers=192.168.1.10:3999 --vault-key=<ВАШ_КЛЮЧ>
cat /tmp/restored.txt
```
Файл скачивается, по частям собирается через матрицу Рида-Соломона и дешифруется со 100% точностью.

---

## 🗺️ Дорожная карта: Нативные версии для Windows и Android

Детальный архитектурный план и график разработки доступен в документе:
👉 **[docs/ROADMAP_WINDOWS_ANDROID.md](docs/ROADMAP_WINDOWS_ANDROID.md)**

* **Windows**:
  - [x] Автоматический инсталлятор PowerShell (`install.ps1`)
  - [ ] Автономная системная служба Windows (через WinSW / NSSM)
  - [ ] Сборка единого бинарника `nexxusd.exe` без необходимости Node.js
  - [ ] Нативное GUI-приложение в системном трее (Tauri / WebView2)
* **Android**:
  - [x] Автоматический скрипт для Termux (`scripts/install-android-termux.sh`) с Wakelock
  - [ ] Нативное приложение APK на **Kotlin + Jetpack Compose**
  - [ ] Android Foreground Service с неснимаемым уведомлением в шторке
  - [ ] Поддержка внешних карт памяти MicroSD через Scoped Storage
  - [ ] Автообновление APK напрямую через GitHub Releases API

---

## 🤖 GitHub Actions и Автоматические Релизы

В репозитории настроен пайплайн CI/CD (`.github/workflows/ci-release.yml`):
* При каждом коммите и Pull Request:
  - Проводится статический анализ кода (`npm run lint`).
  - Прогоняются **113 криптографических тестов** и золотые векторы (Reed-Solomon, ChaCha20, Kademlia, Merkle Tree).
  - Собирается бандл `dist/nexxusd.cjs` и Debian-пакет `nexxus-node_2.0.0_amd64.deb`.
* При создании тега версии (например, `git tag v2.0.0 && git push --tags`):
  - GitHub Actions автоматически создает новый **GitHub Release**.
  - К релизу прикрепляются готовые `.deb` пакеты, бандл и инсталляционные скрипты.

---

## ❓ FAQ и Решение Проблем

#### 1. Как открыть порт в фаерволе Ubuntu?
Если на сервере включен `ufw`, разрешите входящие P2P подключения:
```bash
sudo ufw allow 3999/tcp comment "NeXXUs P2P Wire Protocol"
sudo ufw reload
```

#### 2. Нужен ли белый статический IP-адрес?
Для базового P2P взаимодействия внутри локальной сети или при прямом соединении белый IP удобен, но **не обязателен**. В протокол NeXXUs встроена адресация через **Tor v3 (.onion)**, которая автоматически пробивает любой NAT и не требует проброса портов на роутере.

#### 3. Где хранятся ключи и что делать в случае переноса ноды?
Файл паспорта узла хранится в `/var/lib/nexxus/node_identity.json`. При инициализации (`nexxusd init`) вам показывается **12-словная мнемоническая фраза**. Сохраните её офлайн. Восстановить ноду на любом новом сервере можно командой:
```bash
nexxusd init --mnemonic="ваша фраза из двенадцати слов..."
```

---

<p align="center">
  <b>Разработано для свободного, суверенного и несокрушимого хранения данных.</b><br>
  <sub>NeXXUs Protocol Core • Версия 2.0.0-ubuntu</sub>
</p>
