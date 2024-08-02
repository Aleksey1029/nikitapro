document.addEventListener('DOMContentLoaded', () => {
	const products = [
		{ id: 1, name: 'Product A', price: 12000 },
		{ id: 2, name: 'Product B', price: 15000 },
		{ id: 3, name: 'Product C', price: 20000 },
		{ id: 4, name: 'Product D', price: 25000 },
		{ id: 5, name: 'Product E', price: 30000 },
		{ id: 6, name: 'Product F', price: 35000 },
		{ id: 7, name: 'Product G', price: 40000 },
		{ id: 8, name: 'Product H', price: 45000 },
		{ id: 9, name: 'Product I', price: 50000 },
		{ id: 10, name: 'Product J', price: 55000 },
		{ id: 11, name: 'Product K', price: 60000 },
		{ id: 12, name: 'Product L', price: 65000 },
		{ id: 13, name: 'Product M', price: 70000 },
		{ id: 14, name: 'Product N', price: 75000 },
		{ id: 15, name: 'Product O', price: 80000 },
	]

	const productList = document.getElementById('product-list')
	const searchBar = document.getElementById('search-bar')
	const findButton = document.getElementById('find-button')
	const productDropdown = document.getElementById('product-dropdown')
	const warehouseTableBody = document.querySelector('#warehouse-table tbody')
	const historyTableBody = document.querySelector('#history-table tbody')

	// Функция для отображения продуктов на основе поиска
	function displayProducts(searchQuery) {
		let found = false

		Array.from(warehouseTableBody.rows).forEach(row => {
			const productName = row.cells[0].textContent.toLowerCase()
			if (productName.includes(searchQuery.toLowerCase())) {
				found = true
				row.classList.add('highlight')
				row.scrollIntoView({ behavior: 'smooth', block: 'center' })

				// Убираем подсветку через 5 секунд
				setTimeout(() => {
					row.classList.remove('highlight')
				}, 5000)
			} else {
				row.classList.remove('highlight')
			}
		})

		if (!found) {
			alert('К сожалению товар не найден, введите точное название товара')
		}
	}

	// Функция для поиска и подсветки товара
	function searchProduct() {
		const searchQuery = searchBar.value.trim()

		if (searchQuery === '') {
			alert('Введите название товара')
			return
		}

		displayProducts(searchQuery)
	}

	findButton.addEventListener('click', searchProduct)

	let selectedProduct = null

	// Функция для выбора продукта
	function selectProduct(productId) {
		selectedProduct = products.find(product => product.id === productId)
		document.getElementById('price').value = selectedProduct.price
		productDropdown.value = selectedProduct.id // синхронизируем с выпадающим списком
	}

	// Обработчик для изменения в выпадающем списке
	productDropdown.addEventListener('change', event => {
		const productId = parseInt(event.target.value, 10)
		if (!isNaN(productId)) {
			selectProduct(productId)
		} else {
			selectedProduct = null
			document.getElementById('price').value = 0
		}
	})

	// Загрузка сохраненных данных из localStorage
	function loadWarehouseData() {
		const savedData = localStorage.getItem('warehouseData')
		if (savedData) {
			const warehouseData = JSON.parse(savedData)
			warehouseData.forEach(item => {
				addProductToTable(item.name, item.quantity, item.unitPrice)
			})
		}

		const savedHistory = localStorage.getItem('historyData')
		if (savedHistory) {
			const historyData = JSON.parse(savedHistory)
			historyData.forEach(item => {
				addHistoryToTable(
					item.name,
					item.addedQuantity,
					item.soldQuantity,
					item.unitPrice,
					new Date(item.date)
				)
			})
		}
	}

	// Сохранение данных в localStorage
	function saveWarehouseData() {
		const data = Array.from(warehouseTableBody.rows).map(row => ({
			name: row.cells[0].textContent,
			quantity: parseInt(row.cells[1].textContent, 10),
			unitPrice: parseFloat(row.cells[2].textContent.replace(" so'm", '')),
		}))
		localStorage.setItem('warehouseData', JSON.stringify(data))
	}

	function saveHistoryData(name, addedQuantity, soldQuantity, unitPrice) {
		const currentDate = new Date().toISOString()
		let historyData = JSON.parse(localStorage.getItem('historyData')) || []
		historyData.push({
			name,
			addedQuantity,
			soldQuantity,
			unitPrice,
			date: currentDate,
		})
		localStorage.setItem('historyData', JSON.stringify(historyData))
	}

	// Функция для добавления продукта в таблицу склада
	function addProductToTable(name, quantity, unitPrice) {
		const existingRow = Array.from(warehouseTableBody.rows).find(
			row => row.cells[0].textContent === name
		)

		if (existingRow) {
			const currentQuantity = parseInt(existingRow.cells[1].textContent, 10)
			const newQuantity = currentQuantity + quantity
			existingRow.cells[1].textContent = newQuantity
			existingRow.cells[3].textContent = `${(newQuantity * unitPrice).toFixed(
				2
			)} so'm`
		} else {
			const row = warehouseTableBody.insertRow()
			row.insertCell().textContent = name
			row.insertCell().textContent = quantity
			row.insertCell().textContent = `${unitPrice.toFixed(2)} so'm`
			row.insertCell().textContent = `${(quantity * unitPrice).toFixed(2)} so'm`
		}

		saveWarehouseData()
	}

	// Функция для добавления записи в историю изменений
	function addHistoryToTable(
		name,
		addedQuantity,
		soldQuantity,
		unitPrice,
		date
	) {
		const row = historyTableBody.insertRow()
		row.insertCell().textContent = name
		row.insertCell().textContent = addedQuantity
		row.insertCell().textContent = soldQuantity
		row.insertCell().textContent = `${unitPrice.toFixed(2)} so'm`
		row.insertCell().textContent = date.toLocaleString()
	}

	// Функция для обновления продуктов на складе
	window.updateProducts = function () {
		if (!selectedProduct) {
			alert('Выберите продукт')
			return
		}

		const addedQuantity = parseInt(
			document.getElementById('added-quantity').value,
			10
		)
		const soldQuantity = parseInt(
			document.getElementById('sold-quantity').value,
			10
		)
		const unitPrice = parseFloat(document.getElementById('price').value)

		if (isNaN(addedQuantity) || isNaN(soldQuantity) || isNaN(unitPrice)) {
			alert('Пожалуйста, введите правильные значения для всех полей')
			return
		}

		const existingRow = Array.from(warehouseTableBody.rows).find(
			row => row.cells[0].textContent === selectedProduct.name
		)

		if (existingRow) {
			const currentQuantity = parseInt(existingRow.cells[1].textContent, 10)

			// Calculate the new quantity and check for negatives
			let newQuantity = currentQuantity + addedQuantity - soldQuantity
			if (newQuantity < 0) {
				alert('Количество на складе не может быть отрицательным')
				return
			}

			existingRow.cells[1].textContent = newQuantity
			existingRow.cells[3].textContent = `${(newQuantity * unitPrice).toFixed(
				2
			)} so'm`
		} else {
			// If no existing row, ensure we are not trying to sell more than added
			if (addedQuantity < soldQuantity) {
				alert('Количество на складе не может быть отрицательным')
				return
			}

			addProductToTable(
				selectedProduct.name,
				addedQuantity - soldQuantity,
				unitPrice
			)
		}

		addHistoryToTable(
			selectedProduct.name,
			addedQuantity,
			soldQuantity,
			unitPrice,
			new Date()
		)
		saveHistoryData(
			selectedProduct.name,
			addedQuantity,
			soldQuantity,
			unitPrice
		)

		// Reset input fields
		document.getElementById('added-quantity').value = 0
		document.getElementById('sold-quantity').value = 0
		saveWarehouseData()
	}

	loadWarehouseData()
})
