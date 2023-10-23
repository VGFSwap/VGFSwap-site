from django.shortcuts import render
from django.views.decorators.cache import never_cache


@never_cache
def index(request):
    refer = request.GET.get('refer')
    data = {
        'refer': refer
    }
    return render(request, 'main/index.html', data)


@never_cache
def stake(request):
    return render(request, 'main/stake.html')


@never_cache
def user(request):
    return render(request, 'main/user.html')


@never_cache
def dex(request):
    return render(request, 'main/dex.html')
