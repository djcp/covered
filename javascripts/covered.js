$.extend({

  apiEndpoint: function(){ return 'http://api.dp.la/dev/' },

  searchables: function(){
    return {
      keyword: 'All fields',
      title: 'Title',
      title_keyword: 'Title, keyword',
      creator: 'Creator',
      creator_keyword: 'Creator, keyword',
      date: 'Date',
      description: 'Description',
      description_keyword: 'Description, keyword',
      subject: 'Subject',
      subject_keyword: 'Subject, keyword',
      publisher: 'Publisher',
      language: 'Language',
      id_isbn: 'ISBN',
      id_oclc: 'OCLC',
      id_lccn: 'LCCN',
      id_inst: 'Partner Id',
      call_num: 'Call Number',
      height: 'Height',
      page_count: 'Page Count',
      relation: 'Relation',
      content_link: 'Context Link',
      rights: 'Rights',
      data_source: 'Data Source',
      resource_type: 'Resource Type'
    };
  },

  constructDoc: function(d,facets){
    var node = $('<div />').attr({class: 'doc ' + d.data_source, id: 'doc-' + d.id}), nodeContent = '';
    if(d.id_isbn != undefined){
      $.each(d.id_isbn,function(i,isbn){
      	// var related = $.relatedEditions(isbn);
      	nodeContent += '<img src="http://covers.openlibrary.org/b/isbn/' + isbn + '-S.jpg" class="cover" />';
      	});
    }
    if(d.content_link){nodeContent += '<a target="_blank" href="' + d.content_link[0] + '">';}
    nodeContent += (d.title) ? $.ellipsisSubstr(d.title) : 'Untitled Work';
    if(d.content_link){nodeContent += '</a>';}
    nodeContent += '<span class="data_source">' + d.data_source + '</span>';
    facets[d.data_source] = (facets[d.data_source] == undefined) ? 1 : (facets[d.data_source] + 1);
    return node.append(nodeContent).data('d',d);
  },
	
	relatedEditions: function(isbn){
		var related = [];
		$.getJSON('http://xisbn.worldcat.org/webservices/xid/isbn/' + isbn + '?method=getEditionsa&format=json&fl=*&callback=?')
			.done(function(data){
				if(data.list.length >= 1){
					$.each(data.list,function(i,record){
						related.push(record.isbn[0]);
						});
					return related;
					}
				});
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
    setTimeout(function(){$('#target').isotope('reLayout')}, 500);
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
    }
  });
  
  $.initSearchables();
  
	$('body').on('click','.doc',function(){
		var $doc = $(this);
			$doc.record = $doc.data('d');
		if($doc.record.subject){
			var singleTerm = $.trim($doc.record.subject[0].split(',')[0]);
			if($doc.data('flickrd') !== true){
				$.subjectFlickr($doc,singleTerm);
				$doc.data('flickrd',true);
				}
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
        $('#meta').html('');
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

          $('#meta').append((start + 1) + ' to ' + ((num_found < (start + limit)) ? num_found : (start + limit) )+ ' of ' + num_found + ' found');

          if(start != 0){
            $('#meta').prepend($('<span class="paginate" id="prev" />').attr('data_pagination_start',start - limit).html('&laquo; Previous'));
          }
          if((start + limit) < num_found){
            $('#meta').append($('<span class="paginate" id="next" />').attr('data_pagination_start',start + limit).html('Next &raquo;'));
          }
          
        }
      }
    });
  });
});
