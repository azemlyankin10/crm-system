window.addEventListener('DOMContentLoaded', async () => {
  const clients = await getClients('http://localhost:3000/api/clients', true)
  tableSort(clients)
  renderListWithClients(clients)
  document.getElementById('addClient').addEventListener('click', () => {
    createModal('Новый клиент', 'Сохранить', 'Отмена', 'добавить')
  })

  if(window.location.hash.includes('client=')) {
    openUpdeteWindow()
  }
  window.addEventListener('hashchange', async () => {
    openUpdeteWindow()
  })

  search(document.querySelector('.header__search '))
})

// работа с API
async function getClients(url, useLoader) {
  let loader
  useLoader ? loader = createLoader() : null
  const response = await fetch(url)
                         .then(res => {
                          useLoader ? loader.removeLoader() : null
                          return res.json()
                         })
  return response
}

async function createClient (sn, n, patronym, contactsArray, modal) {
  const client = {
    name: n,
    surname: sn,
    lastName: patronym,
    contacts: contactsArray
  }

  const response = await fetch('http://localhost:3000/api/clients', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(client)
  })
  
  if(response.ok) {
    updateClientList()
    modal.classList.add('modal-window-close')
    setTimeout(() => {
      modal.parentElement.remove()
      clearHash()
    }, 450)
  }
}

async function updateClient(sn, n, patronym, contactsArray, id, modal) {
  const client = {
    name: n,
    surname: sn,
    lastName: patronym,
    contacts: contactsArray
  }

  const response = await fetch(`http://localhost:3000/api/clients/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(client),
    headers: {
      'Content-Type': 'application/json',
    }
  })

  if(response.ok) {
    updateClientList()
    modal.classList.add('modal-window-close')
    setTimeout(() => {
      modal.parentElement.remove()
      clearHash()
    }, 450)
  }
}

async function deleteClient(id, modal) {
  const response = await fetch(`http://localhost:3000/api/clients/${id}`, {
    method: 'DELETE',
  })

  if(response.ok) {
    updateClientList()
    modal.classList.add('modal-window-close')
    setTimeout(() => {
      modal.parentElement.remove()
      clearHash()
    }, 450)
  }
}

async function updateClientList() {
  let updeteClients = await getClients('http://localhost:3000/api/clients')
  tableSort(updeteClients)
  document.getElementById('tbody').innerHTML = ''
  renderListWithClients(updeteClients)
}
// -------------------

//функция поиска с автодополнением
function search(node) {
  const desc = document.createElement('ul')
  desc.classList.add('header__desc-search', 'search-desc')
  node.after(desc)
  let activeElement
  let timeout
  node.addEventListener('input', () => {
    clearHash()
    clearTimeout(timeout)
    timeout = setTimeout(async () => {
      desc.innerHTML = ''
      const values = await getClients(`http://localhost:3000/api/clients?search=${node.value}`)
      values.forEach(elem => {
        const li = document.createElement('li')
        li.classList.add('search-desc__li')
        const a = document.createElement('a')
        a.classList.add('search-desc__btn')
        a.setAttribute('href', `#${elem.id}`)
        a.innerHTML = `${elem.name} ${elem.surname}`
        a.addEventListener('click', () => {
          activeElement ? activeElement.classList.remove('search-active') : null
          activeElement = document.getElementById(elem.id)
          activeElement.classList.add('search-active')
          desc.innerHTML = ''
        })
        desc.append(li)
        li.append(a)
      })
    }, 300)
  })
  window.addEventListener('click', e => {
    if(!e.target.classList.contains('search-desc__btn') && !e.target.classList.contains('table__update')) {
      clearHash()
      desc.innerHTML = ''
      activeElement ? activeElement.classList.remove('search-active') : null
    }
  })

  // фокус по клавишам вверх вниз
  let focusedElement = -1
  window.addEventListener('keydown', (e) => {
    if(desc.children.length > 0) {
      if(e.code === 'ArrowDown') {
        if(focusedElement < 0) {
          focusedElement++
          desc.children[focusedElement].children[0].focus()
        } else if(focusedElement === desc.children.length - 1) {
          return
        } else {
          focusedElement++
          desc.children[focusedElement].children[0].focus()
        }
      }
      if(e.code === 'ArrowUp') {
        if(focusedElement === 0) {
          node.focus()
          focusedElement = -1
        } else if(focusedElement === desc.children.length - 1) {
          focusedElement --
          desc.children[focusedElement].children[0].focus()
        } else if(focusedElement < 0) {
          return
        } else {
          focusedElement--
          desc.children[focusedElement].children[0].focus()
        }
      }
    }
  })
}

// открытие окна "изменить" по хэшу
async function openUpdeteWindow() {
  const hash = window.location.hash
  if(hash.includes('client=')) {
    const id = hash.replace(/#client=/gi, '')
    const person = await getClients(`http://localhost:3000/api/clients/${id}`)
    createModal('Изменить данные', 'Сохранить', 'Удалить клиента', 'изменить', person)
    setTimeout(() => {
      document.querySelectorAll('.table__update').forEach(elem => elem.classList.remove('pending'))
    }, 500)
  }
}

// функция очистки хэша
function clearHash() {
  history.pushState('', document.title, window.location.pathname);
}

// функция создания прелоадера
function createLoader() {
  const tableContainer = document.querySelector('.section-table__wrapper')
  tableContainer.style.overflow = 'inherit'
  const container = document.querySelector('.table__tbody')
  const btn = document.querySelector('#addClient')
  btn.style.opacity = 0
  const loaderWrapper = document.createElement('div')
  loaderWrapper.classList.add('loader-wrap')
  loader = document.createElement('div')
  loader.classList.add('loader')
  loader.textContent = 'Loading...'
  loaderWrapper.append(loader)
  container.append(loaderWrapper)
  const removeLoader = () => {
    loaderWrapper.classList.add('remove-loader')
    setTimeout(() => {
      loaderWrapper.remove()
      tableContainer.style.overflow = 'auto'
      btn.style.opacity = 1
    }, 1000)
  }
  return {
    loaderWrapper,
    removeLoader
  }
}

// функция при валидации изменяет цвет бордера
function validationBorder() {
  !this.value ? this.style.borderColor = 'red' : this.style.borderColor = '#C8C5D1'
}

// функция при валидации изменяет цвет бордера и аутлайна
function validationOutline() {
  !this.value ? this.style.outlineColor = 'red' : this.style.outlineColor = '#C8C5D1'
  !this.value ? this.style.border = '1px solid red' : this.style.border = '1px solid transparent'
}

// функция сортировки при клике на шапку таблицы
function tableSort(clients) {
  const thead = document.getElementById('thead')
  thead.innerHTML = `
    <tr>
      <th scope="col">
        <button class="table__btn table__id table__sort" data-sort="id">ID 
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3.49691e-07 4L0.705 4.705L3.5 1.915L3.5 8L4.5 8L4.5 1.915L7.29 4.71L8 4L4 -3.49691e-07L3.49691e-07 4Z" fill="#9873FF"/>
          </svg>                  
        </button>
      </th>
      <th scope="col">
        <button class="table__btn table__sort" data-sort="name">Фамилия Имя Отчество 
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3.49691e-07 4L0.705 4.705L3.5 1.915L3.5 8L4.5 8L4.5 1.915L7.29 4.71L8 4L4 -3.49691e-07L3.49691e-07 4Z" fill="#9873FF"/>
          </svg> 
          <span>А-Я</span>                 
        </button>
      </th>
      <th scope="col">
        <button class="table__btn table__sort" data-sort="createDate">Дата и время создания
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3.49691e-07 4L0.705 4.705L3.5 1.915L3.5 8L4.5 8L4.5 1.915L7.29 4.71L8 4L4 -3.49691e-07L3.49691e-07 4Z" fill="#9873FF"/>
          </svg>                 
        </button>
      </th>
      <th scope="col">
        <button class="table__btn table__sort" data-sort="updateDate">Последние изменения
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3.49691e-07 4L0.705 4.705L3.5 1.915L3.5 8L4.5 8L4.5 1.915L7.29 4.71L8 4L4 -3.49691e-07L3.49691e-07 4Z" fill="#9873FF"/>
          </svg>                 
        </button>
      </th>
      <th scope="col">
        Контакты
      </th>
      <th scope="col">
        Действия
      </th>
    </tr>
  `
  const btns = document.querySelectorAll('.table__sort')
  let clientsArr = clients
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('tbody').innerHTML = ''
      switch (btn.dataset.sort) {
        case 'id': 
          if(btn.classList.contains('active')) {
            renderListWithClients(clientsArr.sort((a, b) => a.id > b.id ? 1 : -1))
          } else {
            renderListWithClients(clientsArr.sort((a, b) => a.id < b.id ? 1 : -1))
          }
        break;
        case 'name':
          if(btn.classList.contains('active')) {
            clientsArr.sort(function(a, b){
              if(a.surname > b.surname) { return -1; }
              if(a.surname < b.surname) { return 1; }
              return 0;
          })
          renderListWithClients(clientsArr)
          } else {
            clientsArr.sort(function(a, b){
              if(a.surname < b.surname) { return -1; }
              if(a.surname > b.surname) { return 1; }
              return 0;
          })
          renderListWithClients(clientsArr)
          }
        break
        case 'createDate':
          if(btn.classList.contains('active')) {
            clientsArr.sort(function(a, b) {
              a = new Date(a.createdAt);
              b = new Date(b.createdAt);
              return a<b ? -1 : a>b ? 1 : 0;
            })
            renderListWithClients(clientsArr)
          } else {
            clientsArr.sort(function(a, b) {
              a = new Date(a.createdAt);
              b = new Date(b.createdAt);
              return a>b ? -1 : a<b ? 1 : 0;
            })
            renderListWithClients(clientsArr)
          }
        break
        case 'updateDate':
          if(btn.classList.contains('active')) {
            clientsArr.sort(function(a, b) {
              a = new Date(a.updatedAt);
              b = new Date(b.updatedAt);
              return a<b ? -1 : a>b ? 1 : 0;
            })
            renderListWithClients(clientsArr)
          } else {
            clientsArr.sort(function(a, b) {
              a = new Date(a.updatedAt);
              b = new Date(b.updatedAt);
              return a>b ? -1 : a<b ? 1 : 0;
            })
            renderListWithClients(clientsArr)
          }
        break
      }
      btn.classList.toggle('active')
    })
  })
}

// функция работы с объектом даты
function date(dateObj){
  let day = new Date(dateObj).getDate() < 10 
                  ? `0${new Date(dateObj).getDate()}` 
                  : new Date(dateObj).getDate()
  let month = (new Date(dateObj).getMonth() + 1) < 10 
                  ? `0${(new Date(dateObj).getMonth() + 1)}` 
                  : (new Date(dateObj).getMonth() + 1)
  let year = new Date(dateObj).getFullYear()  
  let hours = new Date(dateObj).getHours() < 10
                    ? `0${new Date(dateObj).getHours()}`
                    : new Date(dateObj).getHours()                               
  let minute = new Date(dateObj).getMinutes() < 10
                    ? `0${new Date(dateObj).getMinutes()}`  
                    : new Date(dateObj).getMinutes()  
    
  return {day, month, year, hours, minute}                      
}

// функция создает список клиентов
function renderListWithClients(clients) {
  const tbody = document.getElementById('tbody')
  clients.forEach(person => {
    let {name, surname, lastName, contacts, id, updatedAt, createdAt} = person   
    const create = date(createdAt)
    const update = date(updatedAt)  

    const tr = document.createElement('tr')
    tr.setAttribute('id', id)
    const thId = document.createElement('th')
    thId.setAttribute('scope', 'row')
    thId.classList.add('table__th-id', 'table__th-grey')
    thId.textContent = id
    const tdName = document.createElement('td')
    tdName.classList.add('table__td-name')
    tdName.textContent = `${surname} ${name} ${lastName}`
    const tdDateCreated = document.createElement('td')
    tdDateCreated.classList.add('table__td-date')
    tdDateCreated.innerHTML = `${create.day}.${create.month}.${create.year} <span class="th-grey">${create.hours}:${create.minute}</span>`
    const tdDateUpdated = document.createElement('td')
    tdDateUpdated.classList.add('table__td-date') 
    tdDateUpdated.innerHTML = `${update.day}.${update.month}.${update.year} <span class="th-grey">${update.hours}:${update.minute}</span>`
    const tdContacts = document.createElement('td')
    tdContacts.classList.add('table__td-contacts')
    contacts.forEach(el => {
      let icons = {
        'Доп. телефон': 'phone',
        'Телефон': 'phone',
        'Email': 'email',
        'Vk': 'vk',
        'Facebook': 'fb'
      }
      let icon = icons[el.type] || 'defaultTooltip'

      const btn = document.createElement('button')
      btn.setAttribute('type', 'button')
      btn.classList.add('table__tooltip', icon)
      tdContacts.append(btn)
      tippy(btn, {
        content: `<span class="tippy-type">${el.type}:</span> <span class="tippy-value">${el.value}</span>`,
        allowHTML: true,
      })
    })
    const tdButtonsMove = document.createElement('td')
    tdButtonsMove.classList.add('table__td-move')
    const tdButtonsMoveContainer = document.createElement('div')
    tdButtonsMoveContainer.classList.add('table__btn-group')
    const btnUpdate = document.createElement('button')
    btnUpdate.classList.add('table__update')
    btnUpdate.textContent = 'Изменить'
    btnUpdate.addEventListener('click', () => {
      window.location.hash = `client=${person.id}`
      btnUpdate.classList.add('pending')
    })
    const btnDelete = document.createElement('button')
    btnDelete.classList.add('table__delete')
    btnDelete.textContent = 'Удалить'
    btnDelete.addEventListener('click', () => {
      btnDelete.classList.add('pending')
      setTimeout(() => {
        btnDelete.classList.remove('pending')
      }, 500)
      createModal('Удалить клиента', 'Удалить', 'Отмена', 'удалить', person)
    })

    tbody.append(tr)
    tr.append(thId)
    tr.append(tdName)
    tr.append(tdDateCreated)
    tr.append(tdDateUpdated)
    tr.append(tdContacts)
    tr.append(tdButtonsMove)
    tdButtonsMove.append(tdButtonsMoveContainer)
    tdButtonsMoveContainer.append(btnUpdate)
    tdButtonsMoveContainer.append(btnDelete)
    tbody.append(tr)

  })
}

// создание модального окна
function createModal(title, saveButton, deleteButton, move, person) {
  const wrapModal = document.createElement('div')
  wrapModal.classList.add('modal')
  const modalWidow = document.createElement('div')
  modalWidow.classList.add('modal__dialog')
  const modalContent = document.createElement('div')
  modalContent.classList.add('modal__content')
  const modalHeader = document.createElement('div')
  modalHeader.classList.add('modal__header')
  const titleText = document.createElement('h5')
  titleText.classList.add('modal__title')
  titleText.textContent = title
  const closeModalBtn = document.createElement('button')
  closeModalBtn.classList.add('modal__btn-close')
  closeModalBtn.setAttribute('type', 'button')
  const modalFooter = document.createElement('div')
  modalFooter.classList.add('modal__footer')
  const dangerText = document.createElement('span')
  dangerText.classList.add('modal__dangerText')
  const saveBtn = document.createElement('button')
  saveBtn.classList.add('modal__saveBtn')
  // saveBtn.setAttribute('type', 'submit')
  saveBtn.textContent = saveButton
  const deleteBtn = document.createElement('button')
  deleteBtn.classList.add('modal__deleteBtn')
  deleteBtn.textContent = deleteButton
  const inputWrapSurname = document.createElement('div')
  inputWrapSurname.classList.add('modal__input-wrap')
  const inputSurname = document.createElement('input')
  inputSurname.setAttribute('type', 'text')
  inputSurname.classList.add('modal__input')
  inputSurname.setAttribute('required', '')
  inputSurname.addEventListener('input', validationBorder)
  const labelSurname = document.createElement('label')
  labelSurname.textContent = 'Фамилия'
  inputWrapSurname.append(inputSurname)
  inputWrapSurname.append(labelSurname)
  const inputWrapName = document.createElement('div')
  inputWrapName.classList.add('modal__input-wrap')
  const inputName = document.createElement('input')
  inputName.setAttribute('type', 'text')
  inputName.classList.add('modal__input')
  inputName.setAttribute('required', '')
  inputName.addEventListener('input', validationBorder)
  const labelName = document.createElement('label')
  labelName.textContent = 'Имя'
  inputWrapName.append(inputName)
  inputWrapName.append(labelName)
  const inputWrapPatronymic = document.createElement('div')
  inputWrapPatronymic.classList.add('modal__input-wrap', 'not-important')
  const inputPatronymic = document.createElement('input')
  inputPatronymic.setAttribute('type', 'text')
  inputPatronymic.classList.add('modal__input')
  inputPatronymic.setAttribute('required', '')
  const labelPatronymic = document.createElement('label')
  labelPatronymic.textContent = 'Отчество'
  inputWrapPatronymic.append(inputPatronymic)
  inputWrapPatronymic.append(labelPatronymic)
  const contactsWrapp = document.createElement('div')
  contactsWrapp.classList.add('modal__contacts-wrapp')
  const addContactBtn = document.createElement('button')
  addContactBtn.setAttribute('type', 'button')
  addContactBtn.classList.add('modal__addContactBtn')
  addContactBtn.innerHTML = `
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.00001 4.66659C7.63334 4.66659 7.33334 4.96659 7.33334 5.33325V7.33325H5.33334C4.96668 7.33325 4.66668 7.63325 4.66668 7.99992C4.66668 8.36659 4.96668 8.66659 5.33334 8.66659H7.33334V10.6666C7.33334 11.0333 7.63334 11.3333 8.00001 11.3333C8.36668 11.3333 8.66668 11.0333 8.66668 10.6666V8.66659H10.6667C11.0333 8.66659 11.3333 8.36659 11.3333 7.99992C11.3333 7.63325 11.0333 7.33325 10.6667 7.33325H8.66668V5.33325C8.66668 4.96659 8.36668 4.66659 8.00001 4.66659ZM8.00001 1.33325C4.32001 1.33325 1.33334 4.31992 1.33334 7.99992C1.33334 11.6799 4.32001 14.6666 8.00001 14.6666C11.68 14.6666 14.6667 11.6799 14.6667 7.99992C14.6667 4.31992 11.68 1.33325 8.00001 1.33325ZM8.00001 13.3333C5.06001 13.3333 2.66668 10.9399 2.66668 7.99992C2.66668 5.05992 5.06001 2.66659 8.00001 2.66659C10.94 2.66659 13.3333 5.05992 13.3333 7.99992C13.3333 10.9399 10.94 13.3333 8.00001 13.3333Z" fill="#9873FF"/>
  </svg>
  Добавить контакт
  `
  addContactBtn.addEventListener('click', createInputForContact)

  if(person && move === 'изменить') {
    const titleId = document.createElement('span')
    titleId.classList.add('modal__id')
    titleId.innerHTML = `ID: ${person.id}`
    titleText.append(titleId)
    inputSurname.value = person.surname
    inputName.value = person.name
    inputPatronymic.value = person.lastName
    person.contacts.forEach(elem => {
      createInputForContact(elem.type, elem.value)
    })
  }

  modalHeader.append(titleText)
  modalHeader.append(closeModalBtn)
  modalWidow.append(modalHeader)
  modalFooter.append(dangerText)
  modalFooter.append(saveBtn)
  modalFooter.append(deleteBtn)
  if(move === 'добавить' || move === 'изменить') {
    modalContent.append(inputWrapSurname)
    modalContent.append(inputWrapName)
    modalContent.append(inputWrapPatronymic)
    contactsWrapp.append(addContactBtn)
    modalContent.append(contactsWrapp)
    modalWidow.append(modalContent)

    deleteBtn.addEventListener('click', (e) => {
      if(e.target.textContent === 'Удалить клиента') {
        wrapModal.remove()
        createModal('Удалить клиента', 'Удалить', 'Отмена', 'удалить', person)
      }
    })
  }
  if(move === 'удалить') {
    const textDelete = document.createElement('p')
    textDelete.classList.add('modal__text-delete')
    textDelete.textContent = 'Вы действительно хотите удалить данного клиента?'
    modalWidow.style.alignItems = 'center'
    modalWidow.style.minHeight = '250px'
    modalContent.append(textDelete)
    modalWidow.append(modalContent)
  }
  modalWidow.append(modalFooter)
  wrapModal.append(modalWidow)
  document.body.append(wrapModal)

  window.addEventListener('click', (e) => {
    let click = e.target
    if(click === wrapModal || click === closeModalBtn || click.textContent === 'Отмена') {
      modalWidow.classList.add('modal-window-close')
      setTimeout(() => {
        wrapModal.remove()
        clearHash()
      }, 450)
    }
  })

  function modal__pending() {
    const pandingWrapp = document.createElement('div')
    pandingWrapp.classList.add('modal__panding')
    modalWidow.append(pandingWrapp)
    return pandingWrapp
  }

  saveBtn.addEventListener('click', (e) => {
    e.preventDefault()
    if(move === 'удалить') {
      deleteClient(person.id, modalWidow)
      clearHash()
      return modal__pending()
      // updateClientList()
    }
    
    let surname = inputSurname.value.trim()
    let name = inputName.value.trim()
    let inputsContacts = document.querySelectorAll('.modal__contact-input')
    let contacts = []
    
    if(surname && name) {
      let patronymic = inputPatronymic.value.trim()
      document.querySelectorAll('.modal__contact-input-wrap').forEach(elem => {
        let type = elem.textContent
        let value = elem.children[1].value
        contacts.push({type, value})
      })
      if(move === 'добавить' && contacts.every(elem => elem.value.length > 0)) {
        createClient(surname, name, patronymic, contacts, modalWidow)
        modal__pending()
        clearHash()
        // updateClientList()
      }else if(move === 'изменить' && contacts.every(elem => elem.value.length > 0)) {
        updateClient(surname, name, patronymic, contacts, person.id, modalWidow)
        modal__pending()
        clearHash()
        // updateClientList()
      } else {
        dangerText.textContent = 'Заполните поле с контактом'
      }
    } else {
      dangerText.textContent = 'Заполните обязательные поля'
    }

    !surname ? inputSurname.style.borderColor = 'red' : null
    !name ? inputName.style.borderColor = 'red' : null
    inputsContacts.forEach(input => {
      !input.value ? input.style.border = '1px solid red' : null
    })

  } )
}

// создание кастомного селекта
function createInputForContact(type, value) {
  let nameArr = ['Телефон', 'Доп. телефон', 'Email', 'Vk', 'Facebook', 'Другое']
  let activeName

  const contactInputWrapp = document.createElement('div')
  contactInputWrapp.classList.add('modal__contact-input-wrap')
  const selectWrap = document.createElement('div')
  selectWrap.classList.add('modal__select-wrap')
  const selectContact = document.createElement('button')
  selectContact.setAttribute('type', 'button')
  selectContact.classList.add('modal__selectContact')

  const inputContent = document.createElement('input')
  inputContent.setAttribute('type', 'text')
  inputContent.classList.add('modal__contact-input')
  inputContent.placeholder = 'Введите данные контакта'
  inputContent.addEventListener('input', validationOutline)

  const buttonDeleteInput = document.createElement('button')
  buttonDeleteInput.setAttribute('type', 'button')
  buttonDeleteInput.classList.add('modal__contact-delete-btn')
  buttonDeleteInput.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 0C2.682 0 0 2.682 0 6C0 9.318 2.682 12 6 12C9.318 12 12 9.318 12 6C12 2.682 9.318 0 6 0ZM6 10.8C3.354 10.8 1.2 8.646 1.2 6C1.2 3.354 3.354 1.2 6 1.2C8.646 1.2 10.8 3.354 10.8 6C10.8 8.646 8.646 10.8 6 10.8ZM8.154 3L6 5.154L3.846 3L3 3.846L5.154 6L3 8.154L3.846 9L6 6.846L8.154 9L9 8.154L6.846 6L9 3.846L8.154 3Z" fill="#B0B0B0"/>
    </svg>
  `
  tippy(buttonDeleteInput, {
    content: 'Удалить контакт',
  })
  buttonDeleteInput.addEventListener('click', () => contactInputWrapp.remove())

  if(type && value) {
    let i = nameArr.findIndex(elem => elem === type)
    activeName = nameArr.splice(i, 1)
    inputContent.value = value
  } else {
    activeName = nameArr.splice(1, 1)
  }

  selectContact.textContent = activeName

  selectContact.addEventListener('click', () => {
    selectContact.classList.toggle('open')
    if(selectContact.classList.contains('open')){
      const selectDropdown = document.createElement('ul')
      selectDropdown.classList.add('modal__selectContact-dropdown')
      nameArr.forEach(el => {
        const dropdownItem = document.createElement('li')
        const dropdownBtn = document.createElement('button')
        dropdownBtn.setAttribute('type', 'button') 
        dropdownBtn.classList.add('modal__dropdown-btn')
        dropdownBtn.textContent = el
        dropdownBtn.addEventListener('click', () => {
          nameArr.push(activeName[0])
          const clickElement = dropdownBtn.textContent
          let index = nameArr.findIndex(el => el === clickElement)
          activeName = nameArr.splice(index, 1)
          selectContact.textContent = activeName
          selectDropdown.remove()
          selectContact.classList.remove('open')
      })
      dropdownItem.append(dropdownBtn)
      selectDropdown.append(dropdownItem)
    })
    selectWrap.append(selectDropdown)
    }else {
      document.querySelector('.modal__selectContact-dropdown').remove()
    }
  })

  selectWrap.append(selectContact)
  contactInputWrapp.append(selectWrap)
  contactInputWrapp.append(inputContent)
  contactInputWrapp.append(buttonDeleteInput)

  setTimeout(() => {
    document.querySelector('.modal__addContactBtn').before(contactInputWrapp)
  }, 0)
}