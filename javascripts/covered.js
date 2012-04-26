$.extend({

  apiEndpoint: function(){ return 'http://api.dp.la/v0.03/' },

  searchables: function(){
    return {
      'dpla.keyword': 'All fields',
      'dpla.title': 'Title',
      'dpla.title_keyword': 'Title, keyword',
      'dpla.creator': 'Creator',
      'dpla.creator_keyword': 'Creator, keyword',
      'dpla.date': 'Date',
      'dpla.description': 'Description',
      'dpla.description_keyword': 'Description, keyword',
      'dpla.subject': 'Subject',
      'dpla.subject_keyword': 'Subject, keyword',
      'dpla.publisher': 'Publisher',
      'dpla.language': 'Language',
      'dpla.isbn': 'ISBN',
      'dpla.oclc': 'OCLC',
      'dpla.lccn': 'LCCN',
      'dpla.call_num': 'Call Number',
      'dpla.content_link': 'Content Link',
      'dpla.contributor': 'Contributor',
      'dpla.resource_type': 'Resource Type'
    };
  },

  constructDoc: function(d,facets){
    var node = $('<div />').attr({class: 'doc ' + d['dpla.contributor'], id: 'doc-' + d['dpla.id']});
    var nodeContent = '';

    if(d['dpla.content_link']){
      nodeContent += '<a target="_blank" href="' + d['dpla.content_link'] + '">';
      alert('link found!' + d['dpla.content_link']);
    }
    nodeContent += '<h3 class="title">' + ( (d['dpla.title']) ? $.ellipsisSubstr(d['dpla.title']) : 'Untitled Work' ).replace(/\\|\//g,'') + '</h3>';
    if(d['dpla.content_link']){
      nodeContent += '</a>';
    }

    var isbn = ((typeof(d['dpla.isbn']) === 'object') ? d['dpla.isbn'][0].split('%%')[0] : d['dpla.isbn']);
    nodeContent += '<img src="http://covers.openlibrary.org/b/isbn/' + isbn + '-M.jpg" class="cover" />';

    d['normalized_isbn'] = isbn;

    nodeContent += '<span class="date">' + ((typeof(d['dpla.date']) === 'object') ? d['dpla.date'][0] : d['dpla.date']) + '</span>';
    nodeContent += '<br/><span class="data_source">' + d['dpla.contributor'] + '</span>';
    nodeContent += '<br/><span><a href="http://shlv.me/add-item/?title=' + d['dpla.title'] + '&creator=' + d['dpla.creator'][0] + '&isbn=' + isbn + "&link=http://api.dp.la/v0.03/&content_type=Book" + '">Put on my Shlv.me shelf</a></span>';
    facets[d['dpla.contributor']] = (facets[d['dpla.contributor']] == undefined) ? 1 : (facets[d['dpla.contributor']] + 1);
    return node.append(nodeContent).data('d',d);
  },

	relatedEditions: function(doc,isbn){
		$.getJSON('http://xisbn.worldcat.org/webservices/xid/isbn/' + isbn + '?method=getEditionsa&format=json&fl=*&callback=?')
			.done(function(data){
				if(data.list.length >= 1){
					var output = '<br /><strong><a target="_blank" href="http://www.librarything.com/isbn/' + isbn + '">LibraryThing</a> Jackets</strong>:<br />';
					$.each(data.list,function(i,record){
						if(i <= 10){
						output += '<img src="http://covers.librarything.com/devkey/67af2723f6491710c32b6d9b27bcaa0d/small/isbn/' + record.isbn[0] + '" alt="" />';
						 }
						});
					doc.append(output);
          setTimeout(function(){$('#target').isotope('reLayout')}, 1000);
					}
				});
		return false;
		},
	
	subjectFlickr: function(doc,subject){
		var subj = encodeURIComponent(subject);
		$.getJSON('http://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=ea0707dc3f4b4b3346806560845986c9&license=1,2,3,4,5,6,7&sort=relevance&format=json&text=' + subj + '&jsoncallback=?')
			.done(function(data){
				if(data.photos.photo){
					var output = '<br /><strong><a target="_blank" href="http://www.flickr.com/search/?l=deriv&q=' + subj + '">Flickr results</a> for "' + subject + '"</strong>:<br />';
					$.each(data.photos.photo,function(i,photo){
						if(i <= 3){
							output += $.flickrImage(photo);
							}
						});
					doc.append(output);
					$('.isotope').isotope('reLayout');
					}
				});
		return false;
		},
	
	flickrImage: function(flickrPhoto){
		return '<a href="http://www.flickr.com/photos/' + flickrPhoto.owner + '/' + flickrPhoto.id + '/"><img src="http://farm' + flickrPhoto.farm + '.staticflickr.com/' + flickrPhoto.server + '/' + flickrPhoto.id + '_' + flickrPhoto.secret + '_s.jpg" alt="" height="75" width="75" /></a>';
		},
	
	ellipsisSubstr: function(inString){
		var max = arguments[1] || 100, suffix = arguments[2] || '…'; 
		if(inString.length >= max){
			return inString.substr(0,max) + suffix;
			}
		else{return inString;}
		},
	
  initIsotope: function(){
    var isotope_obj = $('#target').isotope({
      columnWidth: 300,
      itemSelector : '.doc',
      layoutMode : 'masonry'
    });
  },

  postInit: function(){
    $('.filter').click(function(e){
      $('#target').isotope({filter: $(this).attr('data_filter_class')});
    });
    // relayout as cover images may've effected container height.
    setTimeout(function(){$('#target').isotope('reLayout')}, 1000);
  },

  initSearchables: function(){
  	var $searchables = $('#searchables');
    $searchables.append('<select id="searchable_select" />');
    $.each($.searchables(),function(i,el){
      $searchables.find('select').append($('<option/>').attr({value: i}).html(el));
    });
    $('#add_searchable').click(function(e){
      e.preventDefault();
      if($('#term').val() == ''){
        return;
      }
      $('#terms').append(
        $('<span class="searchable_term" />').attr({data_term_value: $('#term').val(), data_term_searchable: $('#searchable_select').val()}).html('<span class="term_field">' + $('#searchable_select').val() + ' </span>: ' + $('#term').val() + "<sup> X </sup>")
      );
      $('form#query')[0].reset();
      $('#start').val(0);
      $('#term').focus();
    });
  },

  formatQuery: function(){
    var query = '';
    $('.searchable_term').each(function(){
      query += 'filter=' + $(this).attr('data_term_searchable') + ':' + $(this).attr('data_term_value') + '&';
    });
    return query;
  },

  initPagination: function(){
    $('.paginate').live({
      click: function(){
        $('#start').val($(this).attr('data_pagination_start'));
        $('form#query').submit();
      }
    });
  }

});

$(document).ready(function(){
	$.initPagination();
	$('.searchable_term sup').live({
    click: function(){
      $(this).closest('.searchable_term').remove();
      $('#submit').click();
    }
  });
  
  $.initSearchables();
  
	$('body').on('click','.doc',function(){
		var $doc = $(this);
			$doc.record = $doc.data('d');
/*		if($doc.record.subject){
			var singleTerm = $.trim($doc.record.subject[0].split(',')[0]);
			if($doc.data('flickrd') !== true){
				$.subjectFlickr($doc,singleTerm);
				$doc.data('flickrd',true);
				}
      }
      */
		if($doc.record['normalized_isbn'] && $doc.data('lted') !== true){
			$.relatedEditions($doc,$doc.record['normalized_isbn']);
			$doc.data('lted',true);
			}
		});

  $('#term').focus();
  $('form#query').submit(function(e){

    $("#add_searchable").click();

    $('#messages').html('');
    e.preventDefault();
    var query = $.formatQuery();
    if (query == ''){
      $('#messages').append('Please enter a query term and click "add term".');
      return false;
    }

    query += "start=" + $('#start').val() + '&';

    $.ajax({
      cache: true,
      url: $.apiEndpoint() + 'item',
      data: query,
      dataType: 'jsonp',
      beforeSend: function(){
        $('#submit').val('please wait . . .');
        $('#target').html('');
        $('#target').isotope('destroy');
        $('#facets').html('');
        $('.meta_inf').html('');
      },
      complete: function(){
        $('#submit').val('go!');
        $.postInit();
      },
      success: function(json){
        $.initIsotope();
        console.log(json);
        var facets = {};
        $(json.docs).each(function(i,el){
          $('#target').isotope('insert',$.constructDoc(el,facets));
        });
        $.each(facets, function(key,val){
          $('#facets').append($('<span/>').attr({class: 'filter', data_filter_class: "." + key}).html(key + ' - ' + val));
        });
        if(json.docs.length == 0){
          $('#messages').html('None found.');
        } else {
          $('#facets').append($('<span/>').attr({class: 'filter', data_filter_class: '*'}).html('Show all'));

          var start = parseInt(json.start);
          var limit = parseInt(json.limit);
          var num_found = parseInt(json.num_found);

          $('.meta_inf').append((start + 1) + ' to ' + ((num_found < (start + limit)) ? num_found : (start + limit) )+ ' of ' + num_found + ' found');

          if(start != 0){
            $('.meta_inf').prepend($('<span class="paginate" id="prev" />').attr('data_pagination_start',start - limit).html('&laquo; Previous'));
          }
          if((start + limit) < num_found){
            $('.meta_inf').append($('<span class="paginate" id="next" />').attr('data_pagination_start',start + limit).html('Next &raquo;'));
          }
          
        }
      }
    });
  });
});
