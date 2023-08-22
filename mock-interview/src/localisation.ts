export const localisation = {
  ru: {
    welcome: "Привет, я бот для поиска собеседований",
    newRequest: "Новая заявка 🆕",
    getRegistrations: "Получить все мои заявки 📂",
    roleOnInterview: "Роль на интервью",
    roles: {
      interviewer: "Интервьюер",
      interviewee: "Интервьюируемый",
    },
    pickLanguageOfInterview: "Выберите язык интервью",
    interviewLanguages: {
      ru: "Интервью на русском",
      en: "Интервью на английском",
      noImportant: "Не важно",
    },
    typeOfInterview: "Выберите тип интервью",
    typesOfInterview: {
      hr: "HR интервью",
      algo: "Алгоритмическое",
      behavioral: "Поведенческое",
    },
    edit: "Редактировать",
    remove: "Удалить",
    applyRegistration: "Применить регистрацию ✅",
    rejectRegistration: "Отменить регистрацию ❌",
    registrationApplied: "Регистрация применена ✅",
    registrationRejected: "Регистрация отменена ❌",
    youDontHaveRegistrations: "У вас нет заявок, создайте новую",
    pickRegistration: "Выберите заявку",
    endRegistrationForm: {
      registrationEnded: "Регистрация завершена",
      role: "Роль",
      language: "Язык",
      type: "Тип",
      languages: {
        ru: "Русский",
        en: "Английский",
        noImportant: "Не важно",
      },
    },
    noPicked: "Не выбрано",
    youAreInterviewer: "Вы интервьюер",
    youAreInterviewee: "Вы интервьюируемый",
    registrationRemoved: "Регистрация удалена",
    toTheMainPage: "На главную",
  },
};

export const commands = {
  newRequest: [
    ...Object.values(localisation).map((x) => x.newRequest),
    "Новая заявка",
  ],
  getRegistrations: [
    ...Object.values(localisation).map((x) => x.getRegistrations),
    "Получить все мои заявки",
  ],
  roleOnInterview: Object.values(localisation).map((x) => x.roleOnInterview),
  interviewer: Object.values(localisation).map((x) => x.roles.interviewer),
  interviewee: Object.values(localisation).map((x) => x.roles.interviewee),
  interviewInRu: Object.values(localisation).map(
    (x) => x.interviewLanguages.ru
  ),
  interviewInEn: Object.values(localisation).map(
    (x) => x.interviewLanguages.en
  ),
  interviewInNoImportant: Object.values(localisation).map(
    (x) => x.interviewLanguages.noImportant
  ),
  typeOfInterview: Object.values(localisation).map((x) => x.typeOfInterview),
  hrInterview: Object.values(localisation).map((x) => x.typesOfInterview.hr),
  algoInterview: Object.values(localisation).map(
    (x) => x.typesOfInterview.algo
  ),
  behavioralInterview: Object.values(localisation).map(
    (x) => x.typesOfInterview.behavioral
  ),
  edit: Object.values(localisation).map((x) => x.edit),
  remove: Object.values(localisation).map((x) => x.remove),
  applyRegistration: [
    ...Object.values(localisation).map((x) => x.applyRegistration),
    "Применить регистрацию",
  ],
  rejectRegistration: [
    ...Object.values(localisation).map((x) => x.rejectRegistration),
    "Отменить регистрацию",
  ],
  toTheMainPage: Object.values(localisation).map((x) => x.toTheMainPage),
};

export type Languagies = keyof typeof localisation;
