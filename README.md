## 📈 가상자산 모의 투자 플랫폼 - 차트레이더스

![소개](https://github.com/user-attachments/assets/653a74bd-33a3-4b05-bca4-b1d287f5e102)

## 📄 목차

- [🚀 프로젝트 소개](#-프로젝트-소개)
  - [기간 / 인원 / 역할](#기간--인원--역할)
  - [디렉터리 구조](#디렉터리-구조)
- [⚙️ 기술 스택](#️-기술-스택)
- [💻 페이지 기능](#-페이지-기능)
  - [💡 메인 페이지](#-메인-페이지)
  - [🌍 마켓 페이지](#-마켓-페이지)
  - [🪙 지갑 페이지](#-지갑-페이지)
  - [✅ 그 외 기능](#-그-외-기능)

## 🚀 프로젝트 소개

> 차트레이더스는 업비트 시세 데이터를 수집·가공해 실시간 시세를 제공하고 모의 투자 기능을 제공합니다.  
> 차트 조회·모의 주문·자산 확인까지. 실제 투자 같은 환경에서 자신의 투자 실력을 성장시켜 보세요.
>
> [사이트 방문하기](https://chartraders.club)

---

### 기간 / 인원 / 역할

- 기간: 2025.12 ~ 현재
- 인원: 1인(풀스택)
- 역할: 프론트엔드 / 백엔드 / 배포 전반 구현
- 배포: FE(Vercel), BE(Oracle Cloud Infrastructure(OCI))

### 디렉터리 구조

```
├─ apps
│  ├─ web        # Next.js 프론트엔드
│  └─ api        # NestJS 백엔드
└─ packages
   └─ shared-types   # FE/BE 공용 타입
```

## ⚙️ 기술 스택

<table>
  <tr>
    <td ><b>Frontend</b></td>
    <td>
      <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white"/>
      <img src="https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white"/>
      <img src="https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=white"/>
      <img src="https://img.shields.io/badge/Lightweight Charts-131622?style=flat-square&logo=tradingview&logoColor=white"/>
      <img src="https://img.shields.io/badge/Tanstack Query-000000?style=flat-square&logo=tanstack&logoColor=white"/>
    </td>
  </tr>
  <tr>
    <td><b>Backend</b></td>
    <td>
      <img src="https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white"/>
      <img src="https://img.shields.io/badge/TypeORM-FE0803?style=flat-square&logo=typeorm&logoColor=white"/>
      <img src="https://img.shields.io/badge/Redis-FF4438?style=flat-square&logo=redis&logoColor=white"/>
      <img src="https://img.shields.io/badge/BullMQ-DB0A40?style=flat-square&logo=redbull&logoColor=white"/>
    </td>
  </tr>
  <tr>
    <td ><b>Infra</b></td>
    <td>
      <img src="https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white"/>
      <img src="https://img.shields.io/badge/Oracle Cloud Infrastructure-CA614C?style=flat-square&logo=oracle&logoColor=white"/>
      <img src="https://img.shields.io/badge/Cloudflare-F38020?style=flat-square&logo=cloudflare&logoColor=white"/>
      <img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white"/>
      <img src="https://img.shields.io/badge/GitHub Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white"/>
      <img src="https://img.shields.io/badge/Nginx-009639?style=flat-square&logo=nginx&logoColor=white"/>
    </td>
  </tr>
  <tr>
    <td ><b>Others</b></td>
    <td>
      <img src="https://img.shields.io/badge/Turborepo-FF1E56?style=flat-square&logo=turborepo&logoColor=white"/>
      <img src="https://img.shields.io/badge/PNPM-F69220?style=flat-square&logo=pnpm&logoColor=white"/>
    </td>
  </tr>
</table>

- Lightweight Charts™는 TradingView의 차트 라이브러리입니다.
- 백엔드 코드는 GitHub Actions를 통해 Docker 이미지로 빌드되어 Oracle Cloud의 인스턴스에서 배포됩니다. 주요 백엔드 기능(DB, Object Storage)은 OCI의 서비스를 사용했습니다.
- Cloudflare는 도메인과 정적 자산 캐싱에, 이미지 최적화는 Vercel을 사용했습니다.

## 💻 페이지 기능

### 💡 메인 페이지

> 실시간 시세 목록과 검색을 제공하는 진입 화면입니다.
>
> 🔒 로그인 유저는 즐겨찾기, 보유 중인 가상 자산을 볼 수 있습니다.

| 메인                                                                                       | 메인-모바일                                                                                |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| ![메인-1](https://github.com/user-attachments/assets/b2d30c32-b8d9-49d8-b2ec-42c1a57fe26f) | ![메인-2](https://github.com/user-attachments/assets/e35aaaaa-b9ca-4803-a158-c5f1e8ce84a4) |

---

### 🌍 마켓 페이지

> 실시간 차트, 오더북, 체결 내역, 주문 UI가 모이는 핵심 화면입니다.
>
> 🔒 로그인 유저는 주문 기능을 사용할 수 있습니다.

| 마켓                                                                                       | 마켓-모바일                                                                                |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| ![마켓-1](https://github.com/user-attachments/assets/b91a799e-1dea-4f59-aecc-5e3f613bf866) | ![마켓-2](https://github.com/user-attachments/assets/6541a34d-f84e-4687-bb16-fa2b733e01c4) |

<details>
<summary><strong>📈 실시간 차트 & 지표 설정 📉</strong></summary><br>

> 실시간 시세와 연동된 일/주/월/년 봉을 제공합니다. 또한 다양한 지표를 추가하고 커스텀할 수 있습니다.

| 실시간 차트 & 지표 설정                                                                    |
| ------------------------------------------------------------------------------------------ |
| ![차트-1](https://github.com/user-attachments/assets/63517710-66ed-4b62-8053-372e4d795dbe) |

- 실시간 캔들 반영
- 과거 데이터 무한 조회
- 이평선, 볼린저밴드 등 보조지표 추가와 커스텀 지원

---

</details>

<details>
<summary><strong>🏛️ 모의 주문</strong></summary><br>

> 업비트 호가 데이터를 기준으로 모의 주문 기능이 동작합니다.
> 매수, 매도 주문이 가능하며, 백엔드에서 자체 구현한 체결 로직으로 전체 또는 일부 체결이 동작합니다.
>
> 현재 업비트 호가 상태에 따라 주문이 실패할 수도 있습니다.

| 모의 주문                                                                                      |
| ---------------------------------------------------------------------------------------------- |
| ![모의주문-1](https://github.com/user-attachments/assets/362453d5-4491-473f-86d3-48aac4cc6806) |

- 지정가 기반 모의 주문 지원
- 주문 가격 입력 시 업비트에서 주문을 지원하는 가격으로 자동 포맷팅 구현
- 모바일 환경에서는 바텀 시트로 UI가 등장
- 주문이 접수되면 주문 큐에 추가되고 주문이 체결되기 전까지 대기. 주문이 체결되기 전까지는 주문 취소 가능 (일부가 체결되었다면 나머지분 취소)

---

</details>

<details>
<summary><strong>🔍 검색</strong></summary><br>

> 현재 주문을 지원하는 마켓 리스트와 검색 기능을 제공합니다.

| 검색                                                                                       | 검색-모바일                                                                                |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| ![검색-1](https://github.com/user-attachments/assets/38cb7794-62a4-4f59-a7ee-8ad4a0a1e205) | ![검색-2](https://github.com/user-attachments/assets/072898cc-40e8-42f2-9306-1854ce4fdb24) |

- 코인 이름과 심볼 기준 검색 지원
- 입력 시 불필요한 호출을 줄이도록 구현

</details>

---

### 🪙 지갑 페이지

> 보유 자산, 주문 내역, 원화 충전 등 투자 이후 흐름을 관리하는 화면입니다.
>
> 🔒 로그인 유저만 기능을 사용할 수 있습니다.

| 자산                                                                                       | 자산-모바일                                                                                |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| ![자산-1](https://github.com/user-attachments/assets/38dc1306-8690-4b6d-8db8-0df7cf5e3d6c) | ![자산-2](https://github.com/user-attachments/assets/fffcfa21-3909-441d-89a2-580a82db51e8) |

<details>
<summary><strong>🗒️ 주문 내역 조회</strong></strong></summary><br>

> 과거에 주문했던 주문 내역을 조회할 수 있습니다.

| 주문 내역 조회                                                                                 |
| ---------------------------------------------------------------------------------------------- |
| ![주문내역-1](https://github.com/user-attachments/assets/6c2ffed3-757e-4b5f-b1b2-9c37a8662704) |

- 월별 조회 가능
- 모바일과 PC에 최적화된 UI를 각각 제공

---

</details>

<details>
<summary><strong>💰 원화 추가 충전</strong></strong></summary><br>

> 원화가 부족한 경우, 원화를 추가로 충전할 수 있습니다. 월 3회까지 가능합니다.

| 원화 추가 충전                                                                                 |
| ---------------------------------------------------------------------------------------------- |
| ![원화충전-1](https://github.com/user-attachments/assets/a1206fa4-aac7-4c53-919b-7802e1e7494d) |

</details>

---

### ✅ 그 외 기능

| 다크모드 전환                                                                                  |
| ---------------------------------------------------------------------------------------------- |
| ![다크모드-1](https://github.com/user-attachments/assets/b1b53cb4-12b2-4ddc-b320-25faefd10302) |

- 서비스에서 모바일/PC 반응형 UI와 다크 모드를 지원합니다.

| 지갑 생성 안내                                                                                 | 지갑 유무에 따라 안내 조건부 UI 출력                                                           |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| ![지갑생성-1](https://github.com/user-attachments/assets/a887b2ed-8671-4f2f-8735-3ae42621c52b) | ![지갑생성-2](https://github.com/user-attachments/assets/a51bde34-9956-492d-ace4-1cfa52879f1c) |

- 🔒 지갑은 로그인 유저만 생성 가능하며, 지갑 생성 후 주문 기능을 사용할 수 있습니다.
