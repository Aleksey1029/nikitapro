let currentWarehouse = 1 // Текущий склад
let warehouses = {
	1: { products: [], history: [] },
	2: { products: [], history: [] },
	3: { products: [], history: [] },
}

const warehouseTableBody = document
	.getElementById('warehouse-table')
	.getElementsByTagName('tbody')[0]
const historyTableBody = document
	.getElementById('history-table')
	.getElementsByTagName('tbody')[0]

const findButton = document.getElementById('find-button')
const searchBar = document.getElementById('search-bar')
const productNameInput = document.getElementById('product-name')
const undoButton = document.getElementById('undo-button')
const suggestionsContainer = document.getElementById('suggestions')

function updateSuggestions() {
	const searchTerm = productNameInput.value.trim().toLowerCase()

	suggestionsContainer.innerHTML = ''

	if (!searchTerm) {
		return
	}

	const suggestions = warehouses[currentWarehouse].products
		.filter(product => product.name.toLowerCase().includes(searchTerm))
		.map(product => product.name)

	suggestions.forEach(suggestion => {
		const div = document.createElement('div')
		div.textContent = suggestion
		div.classList.add('suggestion-item')
		div.addEventListener('click', () => {
			productNameInput.value = suggestion
			suggestionsContainer.innerHTML = ''
		})
		suggestionsContainer.appendChild(div)
	})
}

productNameInput.addEventListener('input', updateSuggestions)

function loadFromLocalStorage() {
	const savedData = localStorage.getItem('warehousesData')
	if (savedData) {
		warehouses = JSON.parse(savedData)
	}
}

function saveToLocalStorage() {
	localStorage.setItem('warehousesData', JSON.stringify(warehouses))
}

function initializeWarehouse() {
	loadFromLocalStorage()
	updateWarehouseButtons()
	updateProductDisplay()
}

function switchWarehouse(warehouseNumber) {
	currentWarehouse = warehouseNumber
	updateWarehouseButtons()
	initializeWarehouse()
}

const warehouseButtons = document.querySelectorAll('.warehouse-button')
warehouseButtons.forEach(button => {
	button.addEventListener('click', () => {
		const warehouseNumber = parseInt(button.dataset.warehouse)
		switchWarehouse(warehouseNumber)
	})
})

function updateWarehouseButtons() {
	warehouseButtons.forEach(button => {
		const warehouseNumber = parseInt(button.dataset.warehouse)
		if (warehouseNumber === currentWarehouse) {
			button.classList.add('active-warehouse')
		} else {
			button.classList.remove('active-warehouse')
		}
	})
}

function updateProductDisplay() {
	warehouseTableBody.innerHTML = ''
	historyTableBody.innerHTML = ''

	warehouses[currentWarehouse].products.forEach((product, index) => {
		const row = warehouseTableBody.insertRow()
		row.insertCell(0).textContent = product.name
		row.insertCell(1).textContent = product.code || '' // Отображение артикула

		let price = product.price || 0
		let total = (product.quantity || 0) * price

		row.insertCell(2).textContent = product.quantity || 0
		row.insertCell(3).textContent = price.toFixed(2)

		const sellingPriceInput = document.createElement('input')
		sellingPriceInput.type = 'text'
		sellingPriceInput.value = product.sellingPrice?.toFixed(2) || '0.00'
		sellingPriceInput.addEventListener('input', event => {
			let value = event.target.value
			value = value.replace(/[^0-9.]/g, '') // Разрешаем только цифры и точку
			event.target.value = value

			product.sellingPrice = parseFloat(value) || 0
			saveToLocalStorage()
		})

		const sellingPriceCell = row.insertCell(4)
		sellingPriceCell.appendChild(sellingPriceInput)

		row.insertCell(5).textContent = total.toFixed(2)

		const deleteCell = row.insertCell(6)
		const deleteButton = document.createElement('button')
		deleteButton.textContent = 'Удалить'
		deleteButton.addEventListener('click', () => deleteProduct(index))
		deleteCell.appendChild(deleteButton)
	})

	warehouses[currentWarehouse].history.forEach(entry => {
		const row = historyTableBody.insertRow()
		row.insertCell(0).textContent = entry.name
		row.insertCell(1).textContent = entry.added || 0
		row.insertCell(2).textContent = entry.sold || 0
		row.insertCell(3).textContent = entry.price || 0
		row.insertCell(4).textContent = new Date(entry.date).toLocaleString()
	})
}

function updateProducts() {
	const productName = document.getElementById('product-name').value.trim()
	const productCode = document.getElementById('product-code').value.trim() // Получаем артикул
	const addedQuantity =
		parseInt(document.getElementById('added-quantity').value) || 0
	const soldQuantity =
		parseInt(document.getElementById('sold-quantity').value) || 0
	let price = parseInt(document.getElementById('price').value)

	if (isNaN(price) || price <= 0) {
		alert('Пожалуйста, укажите корректную цену товара в сумах.')
		return
	}

	if (!productCode) {
		alert('Пожалуйста, укажите артикул товара.')
		return
	}

	if (productName) {
		const product = warehouses[currentWarehouse].products.find(
			p => p.name === productName
		)

		if (product) {
			// Проверка на наличие товара и корректное количество для продажи
			if (product.quantity === 0 && soldQuantity > 0) {
				alert('Товаров нету на складе')
				return
			} else if (product.quantity < soldQuantity) {
				alert('Такого количества для продажи нету на складе')
				return
			}

			// Только изменяем количество товара
			product.quantity += addedQuantity
			product.quantity -= soldQuantity
		} else {
			// Добавляем новый товар с ценой и артикулом
			if (soldQuantity > 0) {
				alert('Товара нету на складе')
				return
			}
			if (addedQuantity === 0) {
				alert(
					'Вы должны добавить хотя бы один товар, чтобы зарегистрировать его на складе.'
				)
				return
			}

			warehouses[currentWarehouse].products.push({
				name: productName,
				code: productCode, // Сохраняем артикул
				quantity: addedQuantity,
				price: price, // Сохраняем цену за единицу
			})

			// Устанавливаем цену продажи
			let sellingPrice =
				parseInt(prompt('Укажите цену продажи для данного товара', '0')) || 0
			warehouses[currentWarehouse].products[
				warehouses[currentWarehouse].products.length - 1
			].sellingPrice = sellingPrice
		}

		// Добавляем запись в историю
		warehouses[currentWarehouse].history.push({
			name: productName,
			added: addedQuantity,
			sold: soldQuantity,
			price: price,
			date: new Date(),
		})

		saveToLocalStorage()
		updateProductDisplay()
	} else {
		alert('Введите название продукта')
	}
}

function findAndHighlightProduct() {
	const searchTerm = searchBar.value.trim().toLowerCase()

	if (!searchTerm) {
		alert('Введите название продукта или артикул для поиска')
		return
	}

	const productRows = warehouseTableBody.getElementsByTagName('tr')
	let found = false

	for (const row of productRows) {
		const productName = row.cells[0].textContent.toLowerCase()
		const productCode = row.cells[1].textContent.toLowerCase() // Артикул в колонке 1 (второй столбец)

		if (productName.includes(searchTerm) || productCode.includes(searchTerm)) {
			row.classList.add('highlight')
			row.scrollIntoView({ behavior: 'smooth', block: 'center' })
			found = true
			setTimeout(() => {
				row.classList.remove('highlight')
			}, 2000)
		} else {
			row.classList.remove('highlight')
		}
	}

	if (!found) {
		alert('Продукт не найден в текущем складе')
	}
}


function deleteProduct(index) {
	if (confirm('Вы уверены, что хотите удалить этот продукт?')) {
		warehouses[currentWarehouse].products.splice(index, 1)
		saveToLocalStorage()
		updateProductDisplay()
	}
}

function undoLastChange() {
	const history = warehouses[currentWarehouse].history
	if (history.length === 0) {
		alert('Нет действий для отката')
		return
	}

	const lastEntry = history.pop()
	const product = warehouses[currentWarehouse].products.find(
		p => p.name === lastEntry.name
	)

	if (product) {
		product.quantity -= lastEntry.added || 0
		product.quantity += lastEntry.sold || 0
		product.price = lastEntry.price || 0

		if (product.quantity <= 0) {
			const index = warehouses[currentWarehouse].products.indexOf(product)
			if (index > -1) {
				warehouses[currentWarehouse].products.splice(index, 1)
			}
		}
	} else {
		warehouses[currentWarehouse].products.push({
			name: lastEntry.name,
			quantity: lastEntry.added || 0,
			price: lastEntry.price || 0,
		})
	}

	saveToLocalStorage()
	updateProductDisplay()
}

undoButton.addEventListener('click', () => {
	if (warehouses[currentWarehouse].history.length === 0) {
		alert('Нет действий для отката')
		return
	}

	const confirmUndo = confirm(
		'Вы точно уверены, что хотите откатить последнее ваше действие?'
	)
	if (confirmUndo) {
		undoLastChange()
	} else {
		console.log('Откат отменен пользователем')
	}
})

/*login*/

// Проверка авторизации при загрузке index.html
window.addEventListener('DOMContentLoaded', () => {
	const currentPath = window.location.pathname
	const loggedInUser = localStorage.getItem('loggedInUser')

	// Если пользователь не авторизован и находится на index.html, перенаправляем на login.html
	if (!loggedInUser && currentPath.includes('127.0.0.1:5500')) {
		window.location.href = 'login.html'
	}

	// Если пользователь авторизован и находится на login.html, перенаправляем на index.html
	if (loggedInUser && currentPath.includes('login.html')) {
		window.location.href = 'index.html'
	}
})

// Функция для сохранения нового пользователя в localStorage
function saveUser(username, password) {
	const users = JSON.parse(localStorage.getItem('users')) || []
	const userExists = users.some(user => user.username === username)

	if (userExists) {
		alert('Пользователь с таким именем уже существует')
	} else {
		users.push({ username, password })
		localStorage.setItem('users', JSON.stringify(users))
		alert('Регистрация успешна! Теперь вы можете войти.')
	}
}

// Функция для проверки логина
function authenticateUser(username, password) {
	const users = JSON.parse(localStorage.getItem('users')) || []
	return users.find(
		user => user.username === username && user.password === password
	)
}

// Обработка формы входа
const loginForm = document.getElementById('login-form')
if (loginForm) {
	loginForm.addEventListener('submit', event => {
		event.preventDefault()
		const username = document.getElementById('username').value
		const password = document.getElementById('password').value

		if (authenticateUser(username, password)) {
			localStorage.setItem('loggedInUser', username) // Сохраняем текущего пользователя
			window.location.href = 'index.html' // Перенаправляем на главную страницу
		} else {
			alert('Неверное имя пользователя или пароль')
		}
	})
}

// Обработка формы регистрации
const registerForm = document.getElementById('register-form')
if (registerForm) {
	registerForm.addEventListener('submit', event => {
		event.preventDefault()
		const username = document.getElementById('reg-username').value
		const password = document.getElementById('reg-password').value

		if (username && password) {
			saveUser(username, password)
		} else {
			alert('Пожалуйста, заполните все поля')
		}
	})
}

// Логика выхода из системы на index.html
const logoutButton = document.getElementById('logout-button')
if (logoutButton) {
	logoutButton.addEventListener('click', () => {
		localStorage.removeItem('loggedInUser') // Удаляем данные о текущем пользователе
		window.location.href = 'login.html' // Перенаправляем на страницу логина
	})
}

/*login end*/

initializeWarehouse()
