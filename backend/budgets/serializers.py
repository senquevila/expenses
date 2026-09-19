from rest_framework import serializers

from budgets.models import Budget, BudgetAssignment, Category


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"


class BudgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Budget
        fields = "__all__"


class BudgetAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = BudgetAssignment
        fields = "__all__"
