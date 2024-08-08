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

// Загрузка данных из localStorage
function loadFromLocalStorage() {
	const savedData = localStorage.getItem('warehousesData')
	if (savedData) {
		warehouses = JSON.parse(savedData)
	}
}

// Сохранение данных в localStorage
function saveToLocalStorage() {
	localStorage.setItem('warehousesData', JSON.stringify(warehouses))
}

// Инициализация склада
function initializeWarehouse() {
	loadFromLocalStorage()
	updateWarehouseButtons()
	updateProductDisplay()
}

// Обработчик переключения склада
function switchWarehouse(warehouseNumber) {
	currentWarehouse = warehouseNumber
	updateWarehouseButtons()
	initializeWarehouse()
}

// Обработчик события нажатия на кнопку склада
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

	warehouses[currentWarehouse].products.forEach(product => {
		const row = warehouseTableBody.insertRow()
		row.insertCell(0).textContent = product.name
		row.insertCell(1).textContent = product.quantity
		row.insertCell(2).textContent = product.price
		row.insertCell(3).textContent = product.quantity * product.price
	})

	warehouses[currentWarehouse].history.forEach(entry => {
		const row = historyTableBody.insertRow()
		row.insertCell(0).textContent = entry.name
		row.insertCell(1).textContent = entry.added
		row.insertCell(2).textContent = entry.sold
		row.insertCell(3).textContent = entry.price
		row.insertCell(4).textContent = new Date(entry.date).toLocaleString()
	})
}

function updateProducts() {
	const productName =
		document.getElementById('product-dropdown').selectedOptions[0].textContent
	const addedQuantity = parseInt(
		document.getElementById('added-quantity').value
	)
	const soldQuantity = parseInt(document.getElementById('sold-quantity').value)
	const price = parseInt(document.getElementById('price').value)

	if (productName && (addedQuantity > 0 || soldQuantity > 0)) {
		const product = warehouses[currentWarehouse].products.find(
			p => p.name === productName
		)

		if (product) {
			product.quantity += addedQuantity
			product.quantity -= soldQuantity
			product.price = price
		} else {
			warehouses[currentWarehouse].products.push({
				name: productName,
				quantity: addedQuantity - soldQuantity,
				price: price,
			})
		}

		warehouses[currentWarehouse].history.push({
			name: productName,
			added: addedQuantity,
			sold: soldQuantity,
			price: price,
			date: new Date(),
		})

		saveToLocalStorage()
		updateProductDisplay()
	}
}

function findAndHighlightProduct() {
	const searchTerm = searchBar.value.trim().toLowerCase()

	if (!searchTerm) {
		alert('Введите название продукта для поиска')
		return
	}

	const productRows = warehouseTableBody.getElementsByTagName('tr')
	let found = false

	for (const row of productRows) {
		const productName = row.cells[0].textContent.toLowerCase()
		if (productName.includes(searchTerm)) {
			row.classList.add('highlight')
			row.scrollIntoView({ behavior: 'smooth', block: 'center' })
			found = true
			setTimeout(() => {
				row.classList.remove('highlight')
			}, 2000)
			break
		}
	}

	if (!found) {
		alert('Продукт не найден в текущем складе')
	}
}

function undoLastChange() {
	const history = warehouses[currentWarehouse].history
	if (history.length === 0) {
		alert('Нет изменений для отката')
		return
	}

	const lastChange = history.pop()
	const product = warehouses[currentWarehouse].products.find(
		p => p.name === lastChange.name
	)

	if (product) {
		product.quantity -= lastChange.added
		product.quantity += lastChange.sold

		// Если количество продукта стало 0 или меньше, удаляем его из списка
		if (product.quantity <= 0) {
			const productIndex =
				warehouses[currentWarehouse].products.indexOf(product)
			if (productIndex > -1) {
				warehouses[currentWarehouse].products.splice(productIndex, 1)
			}
		}
	}

	saveToLocalStorage()
	updateProductDisplay()
}

findButton.addEventListener('click', findAndHighlightProduct)
document.getElementById('undo-button').addEventListener('click', undoLastChange)
initializeWarehouse()
