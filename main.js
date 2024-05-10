class Model {
    constructor() {
        // The balance
        this.balance = 0;
        // The array with all the products objects linked to the local storage
        this.products = JSON.parse(localStorage.getItem("products")) || [];
    }

    // Product methods

    // Add a new product
    addProduct(productName, stock, price) {
        // Find the id of the new product
        const productId = this.products.length === 0 ? 1 : this.products[this.products.length - 1].id + 1;
        // Product creator
        const newProduct = {
            id: productId,
            productName: productName,
            stock: stock,
            price: price,
        };
        // Push the new product into the array with the products
        this.products.push(newProduct);

        // Announce the controller that something has changed and commit changes to local storage
        this._commit();
    }

    recalculateProductIDs(removedProductID) {
        // Get the index of the removed product
        const removedProductIndex = this.products.findIndex((product) => product.id === removedProductID);
        console.log(removedProductIndex);
        // Update the IDs of the remaining products
        for (let i = removedProductIndex; i < this.products.length; i++) {
            this.products[i].id = i + 1; // Update the ID to maintain a sequential order
        }
    }

    // Remove a product type from vending
    removeProduct(specificProductName) {
        this.products = this.products.filter((product) => product.productName !== specificProductName);
        // Announce the controller that something has changed and commit changes to local storage
        this._commit();
    }

    // Get product
    getProduct(enteredId) {
        const requestedProduct = this._findProduct(enteredId);
        const productPrice = requestedProduct.price;

        if (this._checkStock(enteredId) && this._hasBalance(productPrice)) {
            this.decrementStock(enteredId);
            this.payMoney(productPrice);
            this.criteriasMeeted(requestedProduct);
        } else if (!this._checkStock(enteredId)) {
            this.productOutOfStock();
        } else if (!this._hasBalance(productPrice)) {
            this.insufficientFunds(requestedProduct);
        }
        // Announce the controller that something has changed and commit changes to local storage
        this._commit();
    }

    // Finds the refered product
    _findProduct(enteredId) {
        for (let i = 0; i < this.products.length; i++) {
            const idConverted = parseInt(enteredId);
            if (idConverted === this.products[i].id) {
                return this.products[i];
            }
        }
    }

    // Checks the stock of the product
    _checkStock(enteredId) {
        const desiredProduct = this._findProduct(enteredId);
        const isStock = desiredProduct.stock > 0 ? true : false;
        if (!isStock) {
        }
        return isStock;
    }

    // Decrement a product stock
    decrementStock(enteredId) {
        this._findProduct(enteredId).stock -= 1;
    }

    // Balance methods

    // Shows the current balance
    getBalance() {
        return this.balance;
    }

    // Gets the needed balance
    getNeededBalance(requestedProduct) {
        const currentBalance = this.balance;
        const productPrice = requestedProduct.price;
        const neededBalance = productPrice - currentBalance;
        return neededBalance;
    }

    // Updates the balance
    addBalance(bankNoteValue) {
        this.balance += bankNoteValue;
    }

    // Adds the inserted money to the current balance
    insertMoney(moneyInserted) {
        this.balance += moneyInserted;
    }

    // Substracts the needed sum from the current balance
    payMoney(moneyPayed) {
        this.balance -= moneyPayed;
    }

    // Gets the change if the user decides to stop buying and withdraw the remaining balance
    getChange() {
        const change = this.balance;
        console.log(change);
    }

    // Checks if it the user has enough cash
    _hasBalance(productPrice) {
        if (this.balance >= productPrice) {
            return true;
        } else {
            return false;
        }
    }

    // Methods for the logic of displaying a product
    criteriasMeeted(requestedProduct) {
        app.view.displayRequestedProduct(requestedProduct);
    }

    insufficientFunds(requestedProduct) {
        app.view.displayScreenState3(requestedProduct);
    }

    productOutOfStock() {
        app.view.displayScreenState4();
    }
    bindToDoListChanged(callback) {
        this.onToDoListChanged = callback;
    }
    // Commit changes to local storage
    _commit() {
        localStorage.setItem("products", JSON.stringify(this.products));
        this.onToDoListChanged(this.products);
    }
}

class View {
    // Custom constructor
    constructor() {
        // Root
        this.app = this.getElementByClass("#root");

        // Products
        this.products = this.getElementById("products");

        // Screen
        this.digitalScreen = this.getElementById("digitalScreen");

        // Keypad
        this.keyPad = this.getElementById("keypad");

        // Money
        this.money = this.getElementById("money");
    }

    // ELement helper methods
    createElement(tag, className) {
        const element = document.createElement(tag);
        if (className) {
            element.classList.add(className);
        }
        return element;
    }
    getElementByClass(selector) {
        const element = document.querySelector(selector);
        return element;
    }
    getElementById(id) {
        const element = document.getElementById(id);
        return element;
    }
    getRequestedProduct(enteredId) {
        const requestedProduct = app.model.getProduct(enteredId);
        return requestedProduct;
    }

    // Debounce function
    debounce(fn, delay) {
        let timeoutId;
        return (...args) => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            timeoutId = setTimeout(() => {
                fn.apply(this, args);
            }, delay);
        };
    }

    // Balance methods
    updateBalance(balanceText) {
        balanceText.textContent = `Current balance: ${app.model.balance} $`;
    }
    updateNeededBalance(requestedProduct) {
        if (app.model.getNeededBalance(requestedProduct) <= 0) {
            this.neededBalance.textContent = "No more money needed!";
            this.typewriterAnimation(this.neededBalance);
            app.model.getProduct(requestedProduct.id);
            this.goBackToState1();
        } else {
            this.neededBalance.textContent = `Needed balance: ${app.model.getNeededBalance(requestedProduct)} $`;
            this.typewriterAnimation(this.neededBalance);
        }
    }
    displayBalanceText(text) {
        // Uppdates the balance text content
        this.updateBalance(text);
        this.typewriterAnimation(text);
    }
    turnOffBalanceText() {
        setTimeout(() => {
            this.balanceText.style.visibility = "hidden";
            this.balanceTextChild.style.animation = "none";
        }, 3200);
    }

    // Products methods
    displayProducts(products) {
        // Resets the products every time gets called
        while (this.products.firstChild) {
            this.products.removeChild(this.products.firstChild);
        }
        if (products?.length === 0) {
            const soldOutMessage = this.createElement("p", "soldOutMessage");
            soldOutMessage.textContent = "Everything is sold out! We are sorry!";
            this.products.append(soldOutMessage);
        } else {
            products?.forEach((product) => {
                // Creates a product container
                this.productContainer = this.createElement("div", "productContainer");

                // Creates a product pack
                this.productPack = this.createElement("div", "product-pack");

                // Creates a product image
                this.productImage = this.createElement("img", "product-image");
                this.productImage.src = "Photos/Products/" + product.productName + ".jpg";
                this.productImage.alt = product.productName;

                //Creates a product ID
                this.productID = this.createElement("p", "product-id");
                // If ID is less than 10, add a 0 in front
                if (product.id < 10) {
                    this.productID.textContent = "ID: " + "0" + product.id.toString();
                } else {
                    this.productID.textContent = "ID: " + product.id.toString();
                }

                // Creates a product price
                this.productPrice = this.createElement("p", "product-price");
                this.productPrice.textContent = "Price: " + product.price + " $";

                //Creates a product stock
                this.productStock = this.createElement("p", "product-stock");
                this.productStock.textContent = "Left: " + product.stock;
                if (product.stock === 0) {
                    this.productImage.src = "Photos/Products/Out-Of-Stock.png";
                    // Stop the product from displaying if it is out of stock
                    const currentContainer = this.productContainer;
                    setTimeout(() => {
                        // Remove the product
                        currentContainer.style.display = "none";
                        app.model.removeProduct(product.productName);

                        app.model.recalculateProductIDs(product.id);
                    }, 10000);
                }

                // Append all components to the product pack
                this.productPack.append(this.productImage, this.productID, this.productPrice, this.productStock);

                // Append the product pack to productContainer
                this.productContainer.append(this.productPack);

                // Append product to products
                this.products.append(this.productContainer);
            });
        }
    }
    displayRequestedProduct(requestedProduct) {
        setTimeout(() => {
            this.goBackToState1();
        }, 4000);

        // Display the product after a while
        setTimeout(() => {
            this.clearScreen();

            this.requestedProductContainer = this.createElement("div", "");
            this.requestedProductContainer.id = "requestedProduct";

            this.requestedProductImage = this.createElement("img", "");
            this.requestedProductImage.id = "requestedProductImage";
            this.requestedProductImage.src = "Photos/Products/" + requestedProduct.productName + ".jpg";
            this.requestedProductImage.alt = this.requestedProductName;

            this.requestedProductName = this.createElement("p", "");
            this.requestedProductName.id = "requestedProductName";
            this.requestedProductName.textContent = "Here is your " + requestedProduct.productName + "!" + " " + "Enjoy!";

            this.requestedProductContainer.append(this.requestedProductImage, this.requestedProductName);
            this.app.append(this.requestedProductContainer);
        }, 10000);
    }

    // Screen methods
    // Initial screen state
    _screenState = 0;
    clearScreen() {
        while (this.digitalScreen.firstChild) {
            this.digitalScreen.removeChild(this.digitalScreen.firstChild);
        }
    }
    displayScreenState1() {
        // Clears screen
        this.clearScreen();
        // "Initial state" (State 1)
        this._screenState = 1;

        // First text displayed on the screen ("Welcome text" )
        // Create a paragraph for the letter text in the digital Screen
        this.letterTextState1 = this.createElement("p", "firstText");
        this.letterTextState1.textContent = "Hello! Please enter your ID!";
        this.typewriterAnimation(this.letterTextState1);

        // ID container
        // Creates the ID container holding the two figure containers
        this.figuresContainer = this.createElement("div", "figuresContainer");
        //Creates the pointer
        this.pointer = this.createElement("div", "pointer");
        this.resetPointerPosition();
        // Create the first div container
        this.figureContainer1 = this.createElement("div", "figureContainers");
        this.figureContainer1.id = "figContainer1";
        // Create the second div container
        this.figureContainer2 = this.createElement("div", "figureContainers");
        this.figureContainer2.id = "figContainer2";
        // Create the first digit container
        this.figure1 = this.createElement("div", "figures");
        this.figure1.id = "figure1";
        // Create the second digit container
        this.figure2 = this.createElement("div", "figures");
        this.figure2.id = "figure2";
        // Create the span element wrapping the digit and append it
        this.figure1Span = this.createElement("span", "digits");
        this.figure1Span.id = "figure1Span";
        this.figure1Span.textContent = "0";
        this.figure1Span.style.animation = "1s step-end infinite blinker";
        // Create the span element wrapping the digit and append it
        this.figure2Span = this.createElement("span", "digits");
        this.figure2Span.id = "figure2Span";
        this.figure2Span.textContent = "0";
        // Append the spans to the digits cotainer
        this.figure1.append(this.figure1Span);
        this.figure2.append(this.figure2Span);
        // Append the digits container to their respective container
        this.figureContainer1.append(this.figure1);
        this.figureContainer2.append(this.figure2);
        // Append the two figure containers to the ID container
        this.figuresContainer.append(this.pointer, this.figureContainer1, this.figureContainer2);

        // Second text displayed on screen ("Balance text")
        this.balanceText = this.createElement("p", "secondText");
        // Timer to display the balance text after the other animations get finished
        setTimeout(() => {
            this.displayBalanceText(this.balanceText);
        }, 5200);

        // Append the number and the letter text to the digital screen
        this.digitalScreen.append(this.letterTextState1, this.figuresContainer, this.balanceText);
    }
    // Debouncing state 1
    goBackToState1 = this.debounce(this.displayScreenState1, 10000);
    displayScreenState2() {
        // Clears Screen
        this.clearScreen();

        // "Processing state" (State 2)
        this._screenState = 2;

        // Different approach of displaying in order to fit all on one row

        // First text displayed on the screen ("Processing request..." )
        this.letterTextState2Parent = this.createElement("p", "firstText");

        this.letterTextState2 = this.createElement("span");
        this.letterTextState2.id = "letterTextState2";
        this.letterTextState2.textContent = "Proccesing your request...";

        this.pendingDotOne = this.createElement("span", "pendingDots");
        this.pendingDotOne.id = "pendingDot1";
        this.pendingDotTwo = this.createElement("span", "pendingDots");
        this.pendingDotTwo.id = "pendingDot2";
        this.pendingDotThree = this.createElement("span", "pendingDots");
        this.pendingDotThree.id = "pendingDot3";

        this.pendingDots = this.createElement("span", "pendingDotsContainer");

        this.pendingDots.append(this.pendingDotOne, this.pendingDotTwo, this.pendingDotThree);

        this.letterTextState2Parent.append(this.letterTextState2);

        // Typewriter animation
        this.typewriterAnimation(this.letterTextState2Parent);

        // Pending animation
        setTimeout(() => {
            this.letterTextState2.textContent = "Proccesing your request";
            this.letterTextState2Parent.append(this.pendingDots);
        }, 3600);

        setTimeout(() => {
            let initialDelay = 0.4;
            document.querySelectorAll(".pendingDots").forEach((dot) => {
                dot.style.animation = "1.5s infinite pending";
                dot.style.animationDelay = `${initialDelay + 0.3}s`;
                initialDelay += 0.3;
            });
        }, 3600);

        // Append the number and the letter text to the digital screen
        this.digitalScreen.append(this.letterTextState2Parent);
    }
    displayScreenState3(requestedProduct) {
        this._screenState = 3;
        setTimeout(() => {
            // Clears screen
            this.clearScreen();

            // "Insufficient funds" (State 3)

            // First text
            this.letterTextState3 = this.createElement("p", "firstText");
            this.letterTextState3.id = "letterTextState3";
            this.letterTextState3.textContent = "Insufficient funds!";

            // Turn on the animation
            this.typewriterAnimation(this.letterTextState3);

            // Display the current balance
            this.currentBalance = this.createElement("p", "thirdText");
            this.currentBalance.id = "currentBalance";
            this.currentBalance.textContent = `Current balance: ${app.model.balance} $`;
            this.currentBalance.style.visibility = "hidden";

            // Display the needed balance
            this.neededBalance = this.createElement("p", "secondText");
            this.neededBalance.id = "neededBalance";
            this.neededBalance.textContent = `Needed balance: ${app.model.getNeededBalance(requestedProduct)} $`;
            this.neededBalance.style.visibility = "hidden";

            if (app.model.getNeededBalance(requestedProduct) == 0) {
                this.neededBalance.textContent = "No more money needed!";
                this.typewriterAnimation(this.neededBalance);
            }

            // Display after x amount of seconds
            setTimeout(() => {
                this.neededBalance.style.visibility = "visible";
                this.typewriterAnimation(this.neededBalance);
            }, 5300);

            // Append to the screen
            this.digitalScreen.append(this.letterTextState3, this.neededBalance);
        }, 9000);
    }
    displayScreenState4() {
        this._screenState = 4;
        // Timeout to display the state
        setTimeout(() => {
            this.clearScreen();
            this.letterTextState4 = this.createElement("p", "firstText");
            this.letterTextState4.id = "letterTextState4";
            this.letterTextState4.textContent = "Your product is out of stock...";
            this.typewriterAnimation(this.letterTextState4);
            this.digitalScreen.append(this.letterTextState4);
        }, 8000);
        setTimeout(() => {
            this.goBackToState1();
        }, 8000);
    }

    // Money methods
    displayCash() {
        const bankContainers = document.querySelectorAll(".bankContainer");
        bankContainers.forEach((container) => {
            setTimeout(() => {
                container.style.animation = " 2s forwards displayCash";
            }, 9500);
        });
    }

    // Pointer methods
    resetPointerPosition() {
        this.pointer.style.gridColumn = "1 / 2";
    }
    changePointerPostion() {
        if (this.pointer.style.gridColumn === "1 / 2") {
            this.pointer.style.gridColumn = "2 / 3";
        } else {
            this.pointer.style.gridColumn = "1 / 2";
        }
    }

    // Bindings
    bindKeypad(handler) {
        // Animation handler functions
        const addAnimation = (whereToCreateAnimation) => {
            whereToCreateAnimation.style.animation = " 1s step-end infinite blinker";
        };
        const removeAnimation = (whereToRemoveAnimation) => {
            whereToRemoveAnimation.style.removeProperty("animation");
        };
        const swapAnimation = () => {
            if (this.pointer.style.gridColumn === "1 / 2") {
                removeAnimation(this.figure1Span);
                addAnimation(this.figure2Span);
            } else {
                removeAnimation(this.figure2Span);
                addAnimation(this.figure1Span);
            }
            this.changePointerPostion();
        };

        const insertDigit = (newDigit) => {
            if (this.figure1Span.style.animation) {
                this.figure1Span.textContent = newDigit;
                removeAnimation(this.figure1Span);
            } else if (this.figure2Span.style.animation) {
                this.figure2Span.textContent = newDigit;
                removeAnimation(this.figure2Span);
            }
        };

        this.keyPad.addEventListener("click", (event) => {
            if (event.target.classList == "keyButtons") {
                if (event.target.parentElement.id != "keyChange" && event.target.parentElement.id != "keyEnter" && event.target.parentElement.id != "keyBack" && event.target.parentElement.id != "keyNext") {
                    // Finding which button was pressed
                    const pressedButton = event.target;
                    // The new value for the digit
                    const buttonValue = pressedButton.textContent;
                    // Inserting the new digit where it's needed
                    insertDigit(buttonValue);
                } else if (event.target.parentElement.id == "keyChange") {
                    if (this.pointer.style.gridColumn === "1 / 2" && !this.figure1Span.style.animation) {
                        addAnimation(this.figure1Span);
                    } else if (this.pointer.style.gridColumn === "2 / 3" && !this.figure2Span.style.animation) {
                        addAnimation(this.figure2Span);
                    }
                } else if (event.target.parentElement.id == "keyNext") {
                    swapAnimation();
                } else if (event.target.parentElement.id == "keyBack") {
                    swapAnimation();
                } else {
                    // Handling the ID part

                    // Toggle pointer visibility to off
                    this.pointer.style.visibility = "hidden";
                    // Turn off the animation for digits
                    this.figure1Span.style.animation = "none";
                    this.figure2Span.style.animation = "none";

                    // Go into state 2
                    this.displayScreenState2();

                    // Handle the ID
                    this.requestedID = this.figure1Span.textContent + this.figure2Span.textContent;
                    // Pass the ID to the handler
                    handler(this.requestedID);
                }
            }
        });
    }
    bindMoney(handler) {
        this.money.addEventListener("click", (event) => {
            if (event.target.classList == "bank-note") {
                // Animation 1
                event.target.style.animation = "2s forwards cashClicked, 1s forwards 2s cashBack";
                setTimeout(() => {
                    event.target.style.animation = "none";
                }, 3000);

                // Updating the balance
                if (event.target.parentElement.id == "1Dollar") {
                    handler(1);
                    setTimeout(() => {
                        this.displayBalanceText(this.balanceText);
                    }, 1000);
                    // Section for debounce function
                    if (this._screenState === 3) {
                        this.goBackToState1();
                    }
                } else if (event.target.parentElement.id == "5Dollars") {
                    handler(5);
                    setTimeout(() => {
                        this.displayBalanceText(this.balanceText);
                    }, 1000);
                    // Section for debounce function
                    if (this._screenState === 3) {
                        this.goBackToState1();
                    }
                } else if (event.target.parentElement.id == "10Dollars") {
                    handler(10);
                    setTimeout(() => {
                        this.displayBalanceText(this.balanceText);
                    }, 1000);
                    // Section for debounce function
                    if (this._screenState === 3) {
                        this.goBackToState1();
                    }
                }

                // Update needed balance
                if (this._screenState === 3) {
                    this.updateNeededBalance(app.model._findProduct(this.requestedID));
                }
            }
        });
    }

    // Animations
    typewriterAnimation(text) {
        // Creates the child
        const textChild = this.createElement("span", "textChild");
        text.prepend(textChild);

        // Gets the length
        const textLength = text.textContent.length;

        // Applies the animation
        textChild.style.animation = `1.5s steps(${textLength}) 2s forwards typewriter,
        0.6s 0s infinite blinkBorder`;
        setTimeout(() => {
            textChild.style.borderLeft = "hidden";
        }, 3900);
    }
}

class Controller {
    constructor(model, view) {
        // Attaches the model and view to controller
        this.model = model;
        this.view = view;

        // Initial presentation of products
        this.onProductsChanged(this.model.products);

        // Inital state of screen
        this.onScreenStateChanged();

        // Cash rendering
        this.view.displayCash();

        // Bindings
        this.model.bindToDoListChanged(this.onProductsChanged);
        this.view.bindKeypad(this.handleID);
        this.view.bindMoney(this.handleAddBalance);
    }

    onProductsChanged = (products) => {
        this.view.displayProducts(products);
    };

    onScreenStateChanged = () => {
        this.view.displayScreenState1();
    };

    // Handlers
    handleAddBalance = (bankNoteValue) => {
        this.model.addBalance(bankNoteValue);
    };

    handleID = (productID) => {
        this.model.getProduct(productID);
    };
handleUpdateBalance = (balance) => {
        this.view.displayBalanceText(balance);
    };
}

const app = new Controller(new Model(), new View());