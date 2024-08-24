let currentWarehouse = 1 // Текущий склад
let warehouses = {
	1: { products: [], history: [] },
	2: { products: [], history: [] },
	3: { products: [], history: [] },
}

// Элементы управления валютой (если нужно)
// const exchangeRateInput = document.getElementById('exchange-rate');
// const currencySelect = document.getElementById('currency');

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

		let price = product.price || 0
		let total = (product.quantity || 0) * price

		row.insertCell(1).textContent = product.quantity || 0
		row.insertCell(2).textContent = price.toFixed(2)
		row.insertCell(3).textContent = total.toFixed(2)

		const deleteCell = row.insertCell(4)
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
	const addedQuantity =
		parseInt(document.getElementById('added-quantity').value) || 0
	const soldQuantity =
		parseInt(document.getElementById('sold-quantity').value) || 0
	let price = parseInt(document.getElementById('price').value) || 0

	if (productName) {
		const product = warehouses[currentWarehouse].products.find(
			p => p.name === productName
		)

		if (product) {
			if (product.quantity === 0 && soldQuantity > 0) {
				alert('Товаров нету на складе')
				return
			} else if (product.quantity < soldQuantity) {
				alert('Такого количества для продажи нету на складе')
				return
			}

			product.quantity += addedQuantity
			product.quantity -= soldQuantity
			product.price = price
		} else {
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
				quantity: addedQuantity,
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
	} else {
		alert('Введите название продукта')
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
		alert('Нет изменений для отката')
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

		// Удаляем продукт, если его количество стало нулевым или отрицательным
		if (product.quantity <= 0) {
			const index = warehouses[currentWarehouse].products.indexOf(product)
			if (index > -1) {
				warehouses[currentWarehouse].products.splice(index, 1)
			}
		}
	} else {
		// В случае, если продукт был удалён, нужно удалить его из истории и не добавлять обратно
		warehouses[currentWarehouse].products.push({
			name: lastEntry.name,
			quantity: lastEntry.added || 0,
			price: lastEntry.price || 0,
		})
	}

	saveToLocalStorage()
	updateProductDisplay()
}


// Добавляем обработчик события для кнопки "Откат"
undoButton.addEventListener('click', undoLastChange)

// Инициализация при загрузке страницы
initializeWarehouse()
