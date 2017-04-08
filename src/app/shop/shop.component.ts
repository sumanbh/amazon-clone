import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ShopService } from './shop.service';
import { NgbRatingConfig } from '@ng-bootstrap/ng-bootstrap';

import { Brand } from './interfaces/brands.interface';
import { OS } from './interfaces/os.interface';
import { Price } from './interfaces/price.interface';
import { Processor } from './interfaces/processor.interface';
import { RAM } from './interfaces/ram.interface';
import { Storage } from './interfaces/storage.interface';
import { QueryParam } from './interfaces/queryparam.interface';

@Component({
    selector: 'app-shop',
    templateUrl: 'shop.component.html',
    providers: [ShopService, NgbRatingConfig],
    styleUrls: ['shop.component.scss']
})

export class ShopComponent implements OnInit {
    brand: Brand;
    os: OS;
    price: Price;
    processor: Processor;
    ram: RAM;
    storage: Storage;
    searchResult = true;
    minCustom: number;
    maxCustom: number;
    page = 1;
    itemsPerPage = 24;
    data: Array<Object>;
    totalItems: number;
    loading = true;
    queryParams: QueryParam;
    currentPrice: string;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private shopService: ShopService,
        private config: NgbRatingConfig
    ) {
        config.max = 5;
        config.readonly = true;
    }

    ngOnInit() {
        this.route.queryParamMap.subscribe((params) => {
            this.queryParams = params;
            // parses and converts back the query params to truthy checkbox values
            const queryObj = this.shopService.parseQueryParams(this.queryParams);
            this.brand = queryObj.brand;
            this.os = queryObj.os;
            this.price = queryObj.price;
            this.processor = queryObj.processor;
            this.ram = queryObj.ram;
            this.storage = queryObj.storage;
            // parseInt page otherwise ng2-pagination does not function correctly
            if (this.queryParams.params.page) this.page = parseInt(this.queryParams.params.page, 10);
            else this.page = 1;
            // get custom min and max from url if it exists
            if (this.queryParams.params.customprice) {
                const price = this.queryParams.params.customprice.split(',');
                this.minCustom = parseInt(price[0], 10);
                this.maxCustom = parseInt(price[1], 10);
            }
            // get results based on the filter(s)
            this.getResults();
        });
    }

    getPage(page: number, _queryParam: string) {
        // scroll to top on filter change
        if (window.innerWidth >= 768) window.scrollTo(0, 0);
        // page is always 1 when filter is added/removed
        if (_queryParam && _queryParam !== '') page = 1;

        // you can only choose one of the price filter
        if (_queryParam === 'customPrice') {
            this.price = {};
        } else if (this.minCustom && this.maxCustom && _queryParam === 'price') {
            this.minCustom = null;
            this.maxCustom = null;
        }
        // uncheck the previous price filter
        if (!this.currentPrice && Object.keys(this.price).length === 1) this.currentPrice = Object.keys(this.price)[0];
        if (Object.keys(this.price).length === 0) this.currentPrice = null;
        if (Object.keys(this.price).length > 1 && Object.keys(this.price).includes(this.currentPrice)) {
            delete this.price[this.currentPrice];
            this.currentPrice = Object.keys(this.price)[0];
        }

        // collect all the checked values
        const tempObj = Object.assign({}, this.brand, this.os, this.price, this.processor, this.ram, this.storage);
        // returns only truthy checked checkboxes which are formatted correctly
        const serializeQuery = this.shopService.serializeQueryParams(tempObj);
        // prepare query param
        const param = { ...serializeQuery, page };
        // add custom price option if it exists to the query param
        if (this.minCustom && this.maxCustom) param['customprice'] = `${this.minCustom},${this.maxCustom}`;
        this.router.navigate(['laptops'], {
            queryParams: param
        });
    }

    getResults() {
        const tempObj = Object.assign({}, this.brand, this.os, this.price, this.processor, this.ram, this.storage);
        this.shopService.getAllProducts(this.page, this.minCustom, this.maxCustom, tempObj)
            .subscribe(result => {
                if (result.data.length === 0) this.searchResult = false;
                else this.searchResult = true;
                this.loading = false;
                this.data = result.data;
                this.totalItems = result.total;
            });
    }
}
