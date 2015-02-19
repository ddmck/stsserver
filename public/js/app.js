var app = angular.module('App', ['infinite-scroll', 'ngSanitize', 'btford.markdown', 'ui.router', 'ng-token-auth', 'ipCookie', 'ngStorage', 'angularPayments']);
var backendUrl = "https://www.shopshopgo.com/";
Stripe.setPublishableKey('pk_live_j9uqoLXHPhq1clGi5jDnIWpy');


app.config(function($stateProvider, $urlRouterProvider, $authProvider, $locationProvider) {
    
  $stateProvider
  
    // route to show our landing page (/welcome)
    .state('welcome', {
      url: '/welcome',
      templateUrl: 'partials/welcome.html',
      controller: function($scope, $localStorage, WishlistItems){
        if ($localStorage.gender){
          $scope.msg = "Welcome back!";
        } else {
          $scope.msg = "All The Best Stores - One Basket";
        };
        $scope.wishlist = $localStorage.wishlistItems;
        var animationDelay = 2500;
 
        animateHeadline($('.cd-headline'));
         
        function animateHeadline($headlines) {
          $headlines.each(function(){
            var headline = $(this);
            //trigger animation
            setTimeout(function(){ hideWord( headline.find('.is-visible') ) }, animationDelay);
            //other checks here ...
          });
        }

        function hideWord($word) {
          var nextWord = takeNext($word);
          switchWord($word, nextWord);
          setTimeout(function(){ hideWord(nextWord) }, animationDelay);
        }
         
        function takeNext($word) {
          return (!$word.is(':last-child')) ? $word.next() : $word.parent().children().eq(0);
        }
         
        function switchWord($oldWord, $newWord) {
          $oldWord.removeClass('is-visible').addClass('is-hidden');
          $newWord.removeClass('is-hidden').addClass('is-visible');
        }
      }
    })

    .state('basket', {
      url: '/basket',
      templateUrl: 'partials/basket.html',
      controller: 'BasketController'
    })

    .state('pay', {
      abstract: true,
      url: '/pay',
      templateUrl: 'partials/pay.html',
      controller: 'PaymentsController'
    })

    .state('mens', {
      url: '/mens',
      templateUrl: 'partials/mobile-mens-categories.html',
      controller: 'MobileCatController'
    })

    .state('womens', {
      url: '/womens',
      templateUrl: 'partials/mobile-womens-categories.html',
      controller: 'MobileCatController'
    })

    .state('pay.you', {
      url: '/you',
      templateUrl: 'partials/you.html',
      controller: function($scope, $state, $localStorage){
        $scope.goToSignIn = function(){
          $localStorage.returnTo = "pay.address";
          $state.go("account.signIn");
        }, 
        $scope.goToSignUp = function(){
          $localStorage.returnTo = "pay.address";
          $state.go("account.signUp");
        }
      }
    })

    .state('pay.address', {
      url: '/address',
      templateUrl: 'partials/address.html', 
      controller: function($scope, $state, $localStorage){
        $scope.localStorage = $localStorage;
        $scope.submitAddress = function(addressForm) {
          $localStorage.address = addressForm;
          console.log(addressForm);
          $state.go('pay.billing')
        }
      }
    })

    .state('pay.billing', {
      url: '/billing',
      templateUrl: 'partials/billing.html',
      controller: function($scope, $state, $localStorage){
        $scope.localStorage = $localStorage;
        $scope.handleStripe = function(status, response){
          if(response.error) {
            $scope.billingForm.error = response.error;
          } else {
            // got stripe token, now charge it or smt
            $localStorage.token = response.id;
            $localStorage.last4 = $scope.number.slice(-4);
            $state.go('pay.confirmation')
          }
        };
        $scope.clear = function(){
          $localStorage.token = null;
        }
      }
    })

    .state('pay.confirmation', {
      url: '/confirmation',
      templateUrl: 'partials/confirmation.html',
      controller: function($scope, $localStorage, $http, Basket, Deliveries){
        $scope.basket = Basket;
        $scope.deliveries = Deliveries;      
        Basket.fetchBasketItemProducts();
        $scope.localStorage = $localStorage;
        $scope.submitOrder = function(){
          $http.post(backendUrl + "api/orders.json", {order: {
            token: $localStorage.token,
            basket: $localStorage.basketItems,
            deliveries: $localStorage.deliveries,
            address: $localStorage.address
          }});
        } 
      }
    })

    .state('orders', {
      url: '/orders',
      templateUrl: 'partials/orders.html',
      controller: 'OrdersController'
    })

    .state('account', {
      abstract: true,
      url: '/account',
      templateUrl: 'partials/account.html'
    })

    .state('account.signIn', {
      url: '/sign-in',
      templateUrl: 'partials/sign-in.html',
      controller: "UserSessionsController"
    })

    .state('account.signUp', {
      url: '/sign-up',
      templateUrl: 'partials/sign-up.html',
      controller: "UserRegistrationsController"
    })

    .state('products', {
      abstract: true,
      url: '/products',
      templateUrl: 'partials/products.html'
    })

    .state('products.new', {
      url: '/new',
      templateUrl: 'partials/new.html',
      controller: function(Filters, Products){
        Products.resetProducts();
        Products.resetPage();
        Filters.resetAll();
      }
    })

    .state('products.hot', {
      url: '/hot',
      templateUrl: 'partials/hot.html'
    })

    .state('products.saved', {
      url: '/saved',
      templateUrl: 'partials/saved.html',
      controller: function($scope, WishlistItems){
        $scope.wishlist = WishlistItems;
        WishlistItems.fetchWishlistItemProducts();
        $scope.removeFromWishlist = function(product){
          WishlistItems.removeFromWishlistItems(product);
        };
      }
    })

    .state('categoryView', {
      url: '/products/:gender/{catID}-{category}',
      templateUrl: 'partials/category-view.html',
      controller: function($scope, $stateParams, Products, Filters, Categories){
        $scope.category = $stateParams.category;
        Products.resetProducts();
        Products.resetPage();
        Filters.resetAll();
        Filters.setFilter('category', $stateParams.catID);
        Filters.setFilter('gender', $stateParams.gender);
      }
    })

    .state('productDetail', {
      url: '/products/:productID',
      templateUrl: 'partials/product-detail.html',
      controller: "ProductDetailController"
    })

    .state('search', {
      url: '/search?searchString&category',
      templateUrl: "partials/search-results.html",
      controller: function($scope, $stateParams, Products){
        $scope.searchString = $stateParams.searchString;
        Products.resetProducts();
        Products.resetPage();
        Products.fetchProducts();
        Products.enumeratePage();
      }
    })

    .state('delivery', {
      url: '/delivery',
      templateUrl: "partials/delivery.html",
      onEnter: function(){
        window.scrollTo(0,0);
      }
    })

    .state('returns', {
      url: '/returns',
      templateUrl: "partials/returns.html",
      onEnter: function(){
        window.scrollTo(0,0);
      }
    })

    .state('about', {
      url: '/about',
      templateUrl: "partials/about.html",
      onEnter: function(){
        window.scrollTo(0,0);
      }
    })

    .state('pricePromise', {
      url: '/price-promise',
      templateUrl: "partials/price-promise.html",
      onEnter: function(){
        window.scrollTo(0,0);
      }
    })

    .state('stores-list', {
      url: '/stores-list',
      templateUrl: "partials/stores-list.html",
      onEnter: function(){
        window.scrollTo(0,0);
      }
    })

    .state('contact', {
      url: '/contact',
      templateUrl: "partials/contact.html",
      onEnter: function(){
        window.scrollTo(0,0);
      }
    })

    .state('terms', {
      url: '/terms',
      templateUrl: "partials/terms.html",
      onEnter: function(){
        window.scrollTo(0,0);
      }
    })

    .state('privacy', {
      url: '/privacy',
      templateUrl: "partials/privacy.html",
      onEnter: function(){
        window.scrollTo(0,0);
      }
    })
      
  // catch all route
  // send users to the form page 
  $urlRouterProvider
    .when('/products', 'products/new')
    .when('/account', 'account/sign-in')
    .when('/pay', 'pay/ypu')
    .otherwise('/welcome');
  
  $authProvider.configure({
      apiUrl: backendUrl + 'api'
  });

  $locationProvider.html5Mode(true);
  $locationProvider.hashPrefix('!');
})


app.directive('ngNavBar', function(){
  return {
    restrict: 'A',
    templateUrl: 'templates/nav-bar-template.html',
    replace: true,
    transclude: true,
    compile: function() {
      var menuToggle = $('#js-mobile-menu').unbind();
      $('#js-navigation-menu').removeClass("show");

      menuToggle.on('click', function(e) {
        e.preventDefault();
        $('#js-navigation-menu').slideToggle(function(){
          if($('#js-navigation-menu').is(':hidden')) {
            $('#js-navigation-menu').removeAttr('style');
          }
        });
      });
      $('.nav-link a').on('click', function(e) {
        e.preventDefault();
        $('#js-navigation-menu').slideToggle(function(){
          if($('#js-navigation-menu').is(':hidden')) {
            $('#js-navigation-menu').removeAttr('style');
            window.scrollTo(0,0);
          }
        });
      });
    }
  }
});

app.directive('ngCallouts', function(){
  return {
    restrict: 'A',
    templateUrl: 'templates/callouts-template.html',
    replace: true,
    transclude: true,
    compile: function(){
      $(document).foundation('equalizer', 'reflow');
    }
  }
});

app.directive('ngFooter', function(){
  return {
    restrict: 'A',
    templateUrl: 'templates/footer-template.html',
    replace: true,
    transclude: true
  }
});

app.directive('ngSizeDropdown', function(){
  return {
    restrict: 'A',
    templateUrl: 'templates/size-dropdown.html',
    replace: true,
    transclude: true
  }
});

app.directive('ngProductDetails', function(){
  return {
    restrict: 'A',
    templateUrl: 'templates/product-details.html',
    replace: true,
    transclude: true
  }
});

app.directive('ngProductList', function(){
  return {
    restrict: "A",
    templateUrl: 'templates/product-list.html',
    replace: true,
    transclude: true
  }
});
app.factory('Filters', ['$location', function($location){
  // Hacky way to prevent location being set to empty string causing refresh
  var filters = {};

  return {
    getFilters: function(){
      return filters;
    },
    setFilter: function(name, value){
      filters[name] = value;
      // $location.search(name, value);
    },
    removeFilter: function(name){
      delete filters[name];
      if (_.isEmpty(filters)) {
        $location.url($location.path())
      } else {
        $location.search(name, null);
      }
    },
    useQuery: function(query){
      filters = query;
      if (_.isEmpty(filters)) {
        $location.url($location.path())
      } else {
        $location.search(filters);
      }
    },
    resetAll: function(){
      filters = {};
      $location.url($location.path())
    }         
  };
}]);

app.factory('Categories', [ '$http', function($http){
  var categories = [];
  return {
    fetchCategories: function(){
      $http.get(backendUrl + 'categories.json', {async: true}).success(function(data){
        categories = data;
      });
    },
    list: function(){
      return categories;
    }

  }
}]);

app.factory('Stores', [ '$http', function($http){
  var stores = [];
  return {
    fetchStores: function(){
      $http.get(backendUrl + 'stores.json', {async: true}).success(function(data){
        stores = data;
      });
    },
    list: function(){
      return stores;
    },
    listStoresForProducts: function(products){
      var storeIDs = _.map(products, function(p){
        return p.store_id
      });
      storeIDs = _.uniq(storeIDs);
      var s = _.filter(stores, function(str){
        return (_.indexOf(storeIDs, str.id) > -1)
      });
      return s;
    },
    calcStdDeliveryPrice: function(store, products){
      var productsForStore = _.filter(products, function(p){
        return (p.store_id === store.id)
      });
      var totalSpendForStore = 0;
      _.forEach(productsForStore, function(p){
        totalSpendForStore += parseFloat(p.display_price);
      });
      if (parseFloat(store.free_delivery_threshold) < totalSpendForStore){
        return 0
      } else {
        return store.standard_price
      }
    }
  }
}]);

app.factory('Deliveries', ['$localStorage', function($localStorage){
  if (!$localStorage.deliveries){
    $localStorage.deliveries = [];
  };
  return {
    list: function(){
      return $localStorage.deliveries
    },
    addDelivery: function(delivery, store){
      delivery = JSON.parse('{' + delivery + '}');
      var holdingArr = _.reject($localStorage.deliveries, function(d){
        return (d.store == store.id);
      });
      if (delivery.type) {
        holdingArr.push(delivery);
      }
      $localStorage.deliveries = holdingArr;
    }, 
    reset: function(){
      $localStorage.deliveries = [];
    },
    total: function(){
      if ($localStorage.deliveries.length > 0) {
        var total = 0;
         _.forEach($localStorage.deliveries, function(n) { 
          total += n.price; 
        });
        return total;
      } else {
        return "0";
      }
      
    }
  }
}])


app.factory('SubCategories', [ '$http', 'Filters', function($http, Filters){
  var subCategories = [];
  return {
    fetchSubCategories: function(){
      $http.get(backendUrl + 'sub_categories.json', {async: true}).success(function(data){
        subCategories = data;
      });
    },
    list: function(){
      return subCategories;
    },
    availableList: function(){
      return _.filter(subCategories, function(subCat){
        return subCat.category_id === Filters.getFilters().category
      })
    }
  }
}]);

app.factory('Orders', [ '$http', function($http){
  var orders = [];
  return {
    fetchOrders: function(){
      $http.get(backendUrl + 'api/orders.json', {async: true}).success(function(data){
        orders = data;
      });
    },
    list: function(){
      return orders;
    }

  }
}]);

app.factory('WishlistItems', [ '$http', '$localStorage', function($http, $localStorage){
  if (!$localStorage.wishlistItems){
    $localStorage.wishlistItems = [];
  };
  var products = [];
  return {
    update: function(array) {
      $localStorage.wishlistItems = array;
    },
    fetchWishlistItemProducts: function(){
      products = [];
      var wishlistItems = $localStorage.wishlistItems;
      _.forEach(wishlistItems, function(item){
        $http.get(backendUrl + 'products/' + item + '.json').success(function(data){
          products.push(data);
        });
      });
    },
    listProducts: function(){
      return products;
    },
    list: function(){
      return $localStorage.wishlistItems;
    },
    addToWishlistItems: function(product){
      var wishlistItems = $localStorage.wishlistItems;
      wishlistItems.push(product.id);
      $localStorage.wishlistItems = wishlistItems;
    },
    removeFromWishlistItems: function(product){
      var wishlistItems = $localStorage.wishlistItems;
      wishlistItems = _.reject(wishlistItems, function(n){
        return n == product.id
      });
      $localStorage.wishlistItems = wishlistItems;
      products = _.reject(products, function(p){
        return p === product;
      })   
    }
  }
}]);

app.factory('Basket', [ '$http', '$localStorage', function($http, $localStorage){
  if (!$localStorage.basketItems){
    $localStorage.basketItems = [];
  };
  var products = [];
  return {
    update: function(array) {
      $localStorage.basketItems = array;
    },
    fetchBasketItemProducts: function(){
      products = [];
      var basketItems = $localStorage.basketItems;
      _.forEach(basketItems, function(item){
        $http.get(backendUrl + 'products/' + item.productId + '.json').success(function(data){
          data.selectedSize = _.find(data.sizes, function(size){
            return size.id === item.sizeId
          });
          products.push(data);        
        });
      });
    },
    listProducts: function(){
      return products;
    },
    listStores: function(){
      return stores;
    },
    list: function(){
      return $localStorage.basketItems;
    },
    total: function(){
      var result = 0.0;
      _.forEach(products, function(p){
        result += parseFloat(p.display_price)
      });
      return result
    },
    addToBasketItems: function(product){
      var basketItems = $localStorage.basketItems;
      var productWithSize = { 
        productId: product.id,
        sizeId: product.selectedSize.id 
      }
      basketItems.push(productWithSize);
      $localStorage.basketItems = basketItems;
    },
    removeFromBasketItems: function(product){
      var basketItems = $localStorage.basketItems;
      basketItems = _.reject(basketItems, function(n){
        return n.productId == product.id
      });
      $localStorage.basketItems = basketItems;
      products = _.reject(products, function(p){
        return p === product;
      })   
    }, 
    inBasketItems: function(productID){
      return _.some(products, { 'id': productID });
    }
  }
}]);

app.factory('Products', ['$http', 'Filters', '$location', function($http, Filters, $location){
  var query = $location.search();
  Filters.useQuery(query);
  var factory = this;
  var products = [];
  var page = 1;
  var searching = true;
  return {
    getProducts: function(){
      return products;
    },
    currentPage: function(){
      return page;
    },
    currentlySearching: function(){
      return searching;
    },
    enumeratePage: function(){
      page += 1;
    },
    resetProducts: function(){
      products = [];
    },
    resetPage: function(){
      page = 1;
    },
    addProducts: function(newProducts){
      products = products.concat(newProducts);
    },
    fetchProducts: function(){
      console.log("Page: " + page);
      searching = true;
      $http.get(backendUrl + 'products.json', {async: true, params: {page: page.toString(), gender: Filters.getFilters().gender, category: Filters.getFilters().category, sub_category: Filters.getFilters().subCategory, sort: Filters.getFilters().sort, search_string: Filters.getFilters().searchString}}).success(function(data){
        products = products.concat(data);
        scrollActive = true;
        searching = false;
      });
    },
    currentlySearching: function(){
      return searching;
    }
  };
}]);
app.controller('UserSessionsController', ['$scope', '$state', '$auth', '$localStorage', function ($scope, $state, $auth, $localStorage) {
  $scope.$on('auth:login-error', function(ev, reason) { 
    $scope.error = reason.errors[0]; 
  });

  $scope.$on('auth:login-success', function(ev){
    // $state.go('products.new');
    if ($localStorage.returnTo) {
      $state.go($localStorage.returnTo);
      delete $localStorage.returnTo;
    } else {
      $state.go('new');
    }
        
  });
  $scope.handleLoginBtnClick = function() {
    $auth.submitLogin($scope.loginForm)
      .then(function(resp) {
        
      })
      .catch(function(resp) { 
        // handle error response
      });
  };
}]);

app.controller('UserRegistrationsController', ['$scope', '$state', '$auth', '$localStorage', function($scope, $state, $auth, $localStorage) {
  $scope.$on('auth:registration-email-success', function(ev, message){
    $('#signUpModal').foundation('reveal', 'close');
    console.log(message);
    $auth.submitLogin({
      email: $scope.registrationForm.email,
      password: $scope.registrationForm.password
    });
  });

  $scope.handleRegBtnClick = function() {
    $auth.submitRegistration($scope.registrationForm)
      .then(function(resp) { 
        if ($localStorage.returnTo) {
          $state.go($localStorage.returnTo);
          delete $localStorage.returnTo;
        } else {
          $state.go('new');
        }
      })
      .catch(function(resp) { 
        
      });
    };
}]);


app.controller('ProductsController',  ['$http', '$state', 'Filters', 'Products', 'WishlistItems', '$localStorage', function($http, $state, Filters, Products, WishlistItems, $localStorage){
  this.scrollActive = false;
  var scrollActive = this.scrollActive;
  var productCtrl = this;
  productCtrl.products = Products;
  // WishlistItems.fetchWishlistItems();

  this.filters = Filters;
  
  // Products.fetchProducts();

  $http.get(backendUrl + 'products.json', {async: true, params: { 
                                page: this.products.currentPage(), 
                                gender: this.filters.getFilters().gender, 
                                category: this.filters.getFilters().category,
                                sub_category: this.filters.getFilters().subCategory, 
                                search_string: this.filters.getFilters().searchString,
                                sort: Filters.getFilters().sort}
                              }).success(function(data){
    productCtrl.products.addProducts(data);
    scrollActive = true;
  });

  this.viewProduct = function(product) {
    $state.go('productDetail', {productID: product.id})
  };

  this.addToWishlist = function(product){
    var currWishlist = WishlistItems.list();
    if (_.indexOf(currWishlist, product.id) != -1) {
      var currWishlist = _.reject(currWishlist, function(n){
        return n == product.id
      });
      WishlistItems.update(currWishlist);
    } else {
      WishlistItems.addToWishlistItems(product);
    }
    
  };

  // this.wishFor = function(product, userId){
  //   if (!userId) {
  //     $('#signInModal').foundation('reveal', 'open');
  //   } else if (_.some(WishlistItems.list(), { 'product_id': product.id })){
  //      index = _.findIndex(WishlistItems.list(), { 'product_id': product.id })
  //      wishlistItem = WishlistItems.list()[index]
  //      $http.delete(backendUrl + 'wishlist_items/' + wishlistItem.id + '.json', {
  //      } ).success(function(data){
  //       WishlistItems.fetchWishlistItems();
  //      });
  //   } else {
  //     $http.post(backendUrl + 'wishlist_items.json', {wishlist_item: {
  //       product_id: product.id
  //     }} ).success(function(data){
  //       WishlistItems.fetchWishlistItems();
  //     });  
  //   }
    
  // }; 

  this.checkIfWishedFor = function(product_id){
    return _.indexOf(WishlistItems.list(), product_id) != -1;
  },                           


  this.openLink = function(product, userId){

    window.open(product.url,'_blank');
    if (!userId) {
      $('#signUpModal').foundation('reveal', 'open');
    }
  };

  this.nextPage = function(products){

    if (scrollActive === true) {
      scrollActive = false;
      Products.enumeratePage();
      
      $http.get(backendUrl + 'products.json', {async: true, params: {page: Products.currentPage().toString(), gender: this.filters.getFilters().gender, category: this.filters.getFilters().category, sub_category: Filters.getFilters().subCategory, sort: Filters.getFilters().sort, search_string: Filters.getFilters().searchString}}).success(function(data){
        if (data.length > 0) {
          window.data = data;
          productCtrl.products.addProducts(data);
          scrollActive = true;
        } 
      });
    }
  };
}]);

app.controller('GenderController', ['$scope', 'Filters', 'Products', '$localStorage', function($scope, Filters, Products, $localStorage){
  $scope.setGender = function(gender) {
    if ( gender === "mens") {
      Filters.setFilter("gender", "male");
    } else if ( gender === "womens") {
      Filters.setFilter("gender", "female");
    } else if ( gender === "" ){
      Filters.removeFilter("gender")
    }
    $localStorage.gender = Filters.getFilters().gender
    Products.resetProducts();
    Products.resetPage()
    Products.fetchProducts();
  };
}]);

app.controller('CategoryController', ['$scope', 'Filters', 'Products', 'Categories', function($scope, Filters, Products, Categories){
  
  $scope.categories = [];
  Categories.fetchCategories();
  $scope.categories = Categories;
  $scope.filters = Filters;
  $scope.setCategory = function(cat_id){
    if (cat_id === "") {
      Filters.removeFilter("category");
    } else {
      Filters.setFilter("category", parseInt(cat_id));
    }
    Filters.removeFilter("subCategory");
    Products.resetProducts();
    Products.resetPage();
    Products.fetchProducts();
  };
}]);

app.controller('SubCategoryController', ['$scope', 'Filters', 'Products', 'Categories', 'SubCategories', function($scope, Filters, Products, Categories, SubCategories){
  $scope.subCategories = SubCategories;
  $scope.subCategories.fetchSubCategories();
  $scope.filters = Filters;

  $scope.setSubCat = function(sub_cat_id){
    if (sub_cat_id === "") {
      Filters.removeFilter("subCategory");
    } else {
      Filters.setFilter("subCategory", parseInt(sub_cat_id));
    }
    Products.resetProducts();
    Products.resetPage();
    Products.fetchProducts();
  };
}]);

app.controller('MobileCatController', ['$scope', 'Categories', function($scope, Categories){
  Categories.fetchCategories();
  $scope.categories = Categories;

}]);

app.controller('SearchController', ['$state', 'Filters', 'Products', 'Categories', function($state, Filters, Products, Categories){
  this.updateSearch = function(searchString){
    if (searchString === null || searchString === undefined || searchString === '' || searchString === ' ') {
      return
    } else {
      Filters.resetAll();
      Filters.setFilter("searchString", searchString);
      $state.go('search', {searchString: searchString})
    }
  }

  this.findCat = function(searchString){
    Filters.removeFilter("category");
    Filters.removeFilter("subCategory");
    var words = searchString.toLowerCase().split(" ");
    _(words).forEach(function(word){
      if (Filters.getFilters().category === undefined) {
        _(Categories.list()).forEach(function(category){
          if (Filters.getFilters().category === undefined) {
            if (category.name === word){
              Filters.setFilter("category", parseInt(category.id));
            } else if (category.name.substring(0, category.name.length - 1) === word) {
              Filters.setFilter("category", parseInt(category.id));
            }
          }
        });
      }
    });
  };
}]);

app.controller('ToggleController', ['$scope', function($scope){
  $scope.open = false;

  $scope.toggle = function(){
    $scope.open = !$scope.open;
  } 
}]);

app.controller('BasketController', ['$scope', '$localStorage', 'Basket', 'Stores', 'Deliveries', function($scope, $localStorage, Basket, Stores, Deliveries){
  $scope.basket = Basket;
  $scope.stores = Stores;
  $scope.deliveries = Deliveries;
  Deliveries.reset();
  Basket.fetchBasketItemProducts();
  Stores.fetchStores();
  $scope.removeFromBasket = function(product){
    Basket.removeFromBasketItems(product);
  };
  $scope.setDelivery = function(delivery, store){
    Deliveries.addDelivery(delivery, store);
  }
  $scope.valid = function(){
    var numbersMatch = ($scope.stores.listStoresForProducts($scope.basket.listProducts()).length === $scope.deliveries.list().length);
    var gtZero = ($scope.deliveries.list().length > 0);
    return !(numbersMatch && gtZero)
  }

}])

app.controller('PaymentsController', ['$scope', '$auth', '$localStorage', '$state', 'Basket', function($scope, $auth, $localStorage, $state, Basket){
  if ($auth.user.id) {
    $state.go('pay.address');
  }
}]);
app.controller('SortController', ['$scope', 'Filters', 'Products', function($scope, Filters, Products){
  $scope.Filters = Filters;
  $scope.sorters = [
    {
      name: "Name A-Z",
      val: "first_letter, asc"
    },
    {
      name: "Name Z-A",
      val: "first_letter, desc"
    },
    {
      name: "Price Low-High",
      val: "display_price, asc"
    },
    {
      name: "Price High-Low",
      val: "display_price, desc"
    }
  ];

  $scope.setSort = function(sort){
    console.log(sort)
    Filters.setFilter("sort", sort)
    Products.resetProducts();
    Products.resetPage();
    Products.fetchProducts();
  };
}]);

app.controller('OrdersController', ['$scope', 'Orders', function($scope, Orders){
  Orders.fetchOrders();
  $scope.orders = Orders;
}]);

app.controller('ProductDetailController', ['$scope', '$stateParams', '$http', 'Basket', function($scope, $stateParams, $http, Basket){
  // get the id
  $scope.showMenu = false;
  $scope.id = $stateParams.productID;
  $scope.basket = Basket;
  $scope.basket.fetchBasketItemProducts();
  $scope.size = null;

  $http.get(backendUrl + 'products/' + $scope.id + '.json', {async: true}).success(function(data){
    $scope.product = data;
    $scope.currentImg = data.large_image_url || data.image_url;
    $scope.getStoreDetails($scope.product);
    window.scrollTo(0, 0);
  });

  $scope.toggleMenu = function(){
    $scope.showMenu = !$scope.showMenu;
  };

  $scope.setProductImg = function(imgUrl) {
    $scope.currentImg = imgUrl;
  };

  $scope.selectSize = function(size){
    $scope.size = size;
    $scope.showMenu = false;
    $scope.product.selectedSize = size;
  };

  $scope.setButtonMsg = function(inBasket){
    if (!inBasket) {
      $scope.msg = "Adding to Basket";
    } else {
      $scope.msg = "Removing from Basket";
    }
  };

  $scope.addToBasket = function(inBasket){
    if (!inBasket) {
      Basket.addToBasketItems($scope.product);
    } else {
      Basket.removeFromBasketItems($scope.product);
    }
    $scope.basket.fetchBasketItemProducts();
    $scope.msg = null;
  };

  $scope.getStoreDetails = function(product){
    $http.get(backendUrl + 'stores/' + product.store_id + '.json', {async: true}).success(function(data){
      $scope.storeDetails = data
    })
  };
}]);



