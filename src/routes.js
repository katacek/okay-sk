const Apify = require('apify');

exports.handleStart = async ({ $ }) =>
{
    const requestQueue = await Apify.openRequestQueue();
    const links = $('ul.box-menu__line').find('li.box-menu__item:not(.box-menu__item--title)').find('a.box-menu__item__link').map(function ()
    { return $(this).attr('href'); }).get();
    for (let link of links)
    {   
        await requestQueue.addRequest({
            url: link,
            userData: { label: 'LIST' }
        });
    }

};

exports.handleList = async ({ $ }) =>
{
    const requestQueue = await Apify.openRequestQueue();
    const links = $('li.js-gtm-product-wrapper').find('.title').find('a.js-gtm-product-link').map(function ()
    { return $(this).attr('href'); }).get();
    for (let link of links)
    {
        await requestQueue.addRequest({
            url: link,
            userData: { label: 'DETAIL' }
        });
    }

    const nextLink = $('a.next').attr('href');
    if (nextLink)
    {
        await requestQueue.addRequest({
            url: nextLink,
            userData: { label: 'LIST' }
        });
    }
    
};

exports.handleDetail = async ({ request, $ }) => {

    let productDescription = JSON.parse($('div#page-product-detail').children().first().attr('data-product'));


    let result = {};
    result.itemUrl = request.url;
    result.itemId = productDescription.id;
    result.itemName = $('.product-title.js-productTitle').text().trim();
    result.currentPrice = parseFloat($('#product_price_wv').text().replace(/\s/g, '').replace(',', '.'));
    result.originalPrice = parseFloat($('#product_price_recomended').text().replace(/\s/g, '').replace(',', '.'));
    let additionalDiscount = productDescription.labels.find(x => x.includes('ZĽAVA'));
    if (additionalDiscount)
    {
        additionalDiscount = parseFloat(additionalDiscount.replace('ZĽAVA','').trim());
        if (additionalDiscount)
            result.currentPrice = Math.round(result.currentPrice * ((100 - additionalDiscount) / 100)* 100) / 100;
    }
    if (!result.originalPrice) result.originalPrice = result.currentPrice;
    result.discounted = result.currentPrice < result.originalPrice;
    result.breadcrumb = $('p#menu-breadcrumb').text().trim().split('OKAY »')[1];
    result.currency = "EUR";
    result.inStock = !!$('p#availability:contains(kus)').text();
    result.img = $('a#js-zoomingLinkGallery').attr('href');
    result.vatInfo = $('.price-highlight.price-name').text();

    Apify.pushData(result)
};
